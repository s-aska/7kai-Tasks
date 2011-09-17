package DoubleSpark::Web::C::API::Account;
use strict;
use warnings;
use JSON::XS;
use Log::Minimal;
use Time::HiRes;

sub me {
    my ($class, $c) = @_;

    my $account = $c->account;

    # サブアカウント取得
    my $tw_accounts = $c->db->search('tw_account', {
        account_id => $account->account_id
    });
    my $fb_accounts = $c->db->search('fb_account', {
        account_id => $account->account_id
    });
    my $email_accounts = $c->db->search('email_account', {
        account_id => $account->account_id
    });
    my @sub_accounts = map {
        $_ = $_->get_columns;
        $_->{data} = decode_json($_->{data}) if $_->{data};
        $_;
    }
        ($tw_accounts->all, $fb_accounts->all, $email_accounts->all);
    my @codes = map { $_->{code} } @sub_accounts;

    unless (@codes) {
        # sub account nothing...
        critf('missing sub accounts aid:%s', $account->account_id);
        $c->session->expire;
        return $c->res_401();
    }

    # リスト取得
    my $my_lists = $c->db->search('list', {
        code => \@codes
    });
    my $list_members = $c->db->search('list_member', {
        code => \@codes
    });
    my %ids;
    for ($my_lists->all, $list_members->all) {
        $ids{$_->list_id}++;
    }
    my $list_ids = join(',', sort keys %ids);
    my @lists;
    if (my $if_modified_since = $c->req->param('if_modified_since')) {
        my $if_modified_lists = $c->req->param('if_modified_lists') || '';
        my $count = $c->db->count('list', '*', {
            list_id => [keys %ids],
            actioned_on => { '>' => $if_modified_since } });
        if (!$count and
            ($account->modified_on <= $if_modified_since) and
            ($list_ids eq $if_modified_lists)) {
            return $c->res_304();
        }
    }
    if (%ids) {
        @lists = map { $_->as_hashref }
            $c->db->search('list', { list_id => [keys %ids] })->all;
    }

    $c->render_json({
        success      => 1,
        sign         => $c->sign,
        account      => $account->data,
        modified_on  => $account->modified_on,
        sub_accounts => \@sub_accounts,
        lists        => \@lists,
        list_ids     => $list_ids
    });
}

sub update {
    my ($class, $c) = @_;

    my $account = $c->account;
    my $method  = $c->req->param('method') || 'set';
    my $type    = $c->req->param('type') || 'string';
    my $ns      = $c->req->param('ns');
    my $key     = $c->req->param('key');
    my $val     = $c->req->param('val');

    if ($type eq 'json') {
        $val = decode_json($val);
    }

    my $data = $account->data;
    for (split /\./, $ns) {
        unless (exists $data->{$_}) {
            $data->{$_} = {};
        }
        $data = $data->{$_};
    }
    if ($method eq 'set') {
        $data->{$key} = $val=~/^\d+$/ ? int($val) : $val;
    } elsif ($method eq '+') {
        $data->{$key}->{$val}++;
    } elsif ($method eq '-') {
        delete $data->{$key}->{$val};
    }
    $account->update({
        data => $account->data,
        modified_on => int(Time::HiRes::time * 1000),
        updated_on => \'now()'
    });

    $c->render_json({
        success => 1,
        account => $account->data
    });
}

sub delete {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        code => [qw/NOT_NULL OWNER/]
    );
    return $c->res_403() unless $res;
    
    my $code = $c->req->param('code');
    
    my $sub_account = $code=~/^tw-\d+$/ ? $c->db->single('tw_account', { code => $code })
                    : $code=~/^fb-\d+$/ ? $c->db->single('fb_account', { code => $code })
                    : $c->db->single('email_account', { code => $code });

    return $c->res_404() unless $sub_account;
    
    for ($c->db->search('list', { code => $code })->all) {
        infof("[%s] delete list %s", $c->sign_name, $_->data->{name});
        $_->delete;
    }
    infof("[%s] delete sub_account %s", $c->sign_name, $code);
    $sub_account->delete;
    
    if ($code eq $c->sign_code) {
        $c->session->remove('sign');
        return $c->render_json({
            success => 1,
            signout => 1
        });
    }
    
    $c->render_json({
        success => 1
    });
}

1;
