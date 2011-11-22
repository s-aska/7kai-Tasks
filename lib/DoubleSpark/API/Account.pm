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
    
    my $account = $c->db->insert('account', {
        data       => $c->config->{Skeleton}->{Account},
        created_on => \'now()',
        updated_on => \'now()'
    });
    $c->db->insert('list', {
        code       => $code,
        data       => {
            name     => "${name}'s list",
            original => 1,
            owner    => $code,
            members  => [],
            users    => [
                {
                    icon => $icon,
                    code => $code,
                    name => $name
                }
            ],
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
                    : $c->db->single('email_account', { code => $code });

    return unless $sub_account;
    
    for ($c->db->search('list', { code => $code })->all) {
        infof("[%s] delete list %s", $c->sign_name, $_->data->{name});
        $_->delete;
    }
    infof("[%s] delete sub_account %s", $c->sign_name, $code);
    $sub_account->delete;
    
    return {
        success => 1
    };
}

1;
