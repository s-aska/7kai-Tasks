package DoubleSpark::Web::C::API::Account;
use strict;
use warnings;
use DoubleSpark::API::Account;
use DoubleSpark::API::Comment;
use DoubleSpark::API::List;
use DoubleSpark::API::Task;
use DoubleSpark::Validator::Query;
use Encode;
use JSON::XS;
use Log::Minimal;

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

sub salvage {
    my ($class, $c) = @_;

    my $account = $c->account;
    
    my $routes = {
        'account.update' => 'DoubleSpark::API::Account#update',
        'task.create'    => 'DoubleSpark::API::Task#create',
        'task.update'    => 'DoubleSpark::API::Task#update',
        'comment.create' => 'DoubleSpark::API::Comment#create',
        'comment.delete' => 'DoubleSpark::API::Comment#delete'
    };
    
    warn $c->req->param('queues');
    my $queues = decode_json(encode_utf8($c->req->param('queues')));
    for my $queue (@{ $queues }) {
        next if ref $queue ne 'HASH';
        my $match = $routes->{ $queue->{api} };
        unless ($match) {
            critf('[%s] uknown api %s', $c->sign_name, $queue->{api});
            next;
        }
        my ($api, $method) = split '#', $match;
        my $req = DoubleSpark::Validator::Query->new($queue->{req});
        if ($api->$method($c, $req)) {
            infof('[%s] salvage success %s', $c->sign_name, $match);
        } else {
            warnf('[%s] salvage skip %s', $c->sign_name, $match);
        }
    }
    
    $c->render_json({
        success => 1
    });
}

sub update {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::Account->update($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub delete {
    my ($class, $c) = @_;
    
    my $res = DoubleSpark::API::Account->delete($c, $c->req);
    
    return $c->res_403() unless $res;
    
    if ($c->req->param('code') eq $c->sign_code) {
        $c->session->remove('sign');
        $res->{signout}++;
    }
    
    $c->render_json($res);
}

1;
