package DoubleSpark::API::Account;
use strict;
use warnings;
use DoubleSpark::Validator;
use JSON::XS;
use Log::Minimal;
use Time::HiRes;

# Webから直接叩かれたら死ぬ
sub create {
    my ($class, $c, $code, $name, $icon) = @_;

    my $data = $c->config->{Skeleton}->{Account};
    $data->{name} = $name;
    $data->{icon} = $icon;
    my $account = $c->db->insert('account', {
        data             => $data,
        created_on       => \'now()',
        updated_on       => \'now()',
        modified_on      => 0,
        authenticated_on => \'now()',
    });
    $c->db->insert('list', {
        account_id => $account->account_id,
        data       => {
            name     => "${name}'s list",
            original => 1,
            tasks    => []
        },
        actioned_on => int(Time::HiRes::time * 1000),
        created_on => \'now()',
        updated_on => \'now()'
    });
    return $account;
}

sub update {
    my ($class, $c, $req) = @_;

    my $account = $c->account;
    my $method  = $req->param('method') || 'set';
    my $type    = $req->param('type') || 'string';
    my $ns      = $req->param('ns');
    my $key     = $req->param('key');
    my $val     = $req->param('val');

    infof('[%s] method:%s type:%s ns:%s key:%s val:%s', $c->sign_name, $method, $type, $ns, $key, $val);

    if ($type eq 'json') {
        $val = decode_json($val);
    }

    my $data = $account->data;
    if ($ns) {
        for (split /\./, $ns) {
            unless (exists $data->{$_}) {
                $data->{$_} = {};
            }
            $data = $data->{$_};
        }
    }
    if ($method eq 'set') {
        $data->{$key} = $val=~/^\d+$/ ? int($val) : $val;
    } elsif ($method eq 'on') {
        $data->{$key}->{$val}++;
    } elsif ($method eq 'off') {
        delete $data->{$key}->{$val};
    }
    $account->update({
        data => $account->data,
        modified_on => int(Time::HiRes::time * 1000),
        updated_on => \'now()'
    });

    return {
        success => 1,
        account => $account->data
    };
}

sub delete {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        code => [qw/NOT_NULL OWNER/]
    );
    return unless $res;

    my $code = $req->param('code');

    my $sub_account = $code=~/^tw-\d+$/ ? $c->db->single('tw_account', { code => $code })
                    : $code=~/^fb-\d+$/ ? $c->db->single('fb_account', { code => $code })
                    : $c->db->single('google_account', { code => $code });

    return unless $sub_account;

    my $account_id = $sub_account->account_id;

    infof("[%s] delete sub_account %s", $c->sign_name, $code);
    $sub_account->delete;

    my $has_sub = $c->db->count('tw_account', '*', { account_id => $account_id });
    unless ($has_sub) {
        $has_sub = $c->db->count('fb_account', '*', { account_id => $account_id });
    }
    unless ($has_sub) {
        $has_sub = $c->db->count('google_account', '*', { account_id => $account_id });
    }
    unless ($has_sub) {
        infof("[%s] delete account %s", $c->sign_name, $account_id);
        $c->db->delete('account', { account_id => $account_id });
    }

    return {
        success => 1
    };
}

1;
