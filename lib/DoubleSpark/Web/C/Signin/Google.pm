package DoubleSpark::Web::C::Signin::Google;
use strict;
use warnings;
use DoubleSpark::API::Account;
use Net::OpenID::Consumer::Lite;
use Log::Minimal;
use Digest::MD5 qw(md5_hex);

sub signin {
    my ($self, $c) = @_;

    my $config = $c->config;
    my $error;
    $error = 'please set return_to' unless $config->{OpenID}->{return_to};
    $error.= 'please set realm' unless $config->{OpenID}->{realm};
    if ($error) {
        critf('signin.twitter.callback %s', $error);
        $c->redirect('/', { google_error => 1 });
    }
    my %query = (
        'openid.ns'         => 'http://specs.openid.net/auth/2.0',
        'openid.claimed_id' => 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.identity'   => 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.return_to'  => $config->{OpenID}->{return_to},
        'openid.realm'      => $config->{OpenID}->{realm},
        'openid.mode'       => 'checkid_setup'
    );
    my @required = ('email');
    # my @required = $c->req->param('openid.ax.required');
    if (@required) {
        my $axschema = {
            country   => 'http://axschema.org/contact/country/home',
            email     => 'http://axschema.org/contact/email',
            firstname => 'http://axschema.org/namePerson/first',
            language  => 'http://axschema.org/pref/language',
            lastname  => 'http://axschema.org/namePerson/last'
        };
        for my $type (@required) {
            $query{'openid.ax.type.'.$type} = $axschema->{$type};
        }
        $query{'openid.ax.required'} = join(',', @required);
        $query{'openid.ns.ax'} = 'http://openid.net/srv/ax/1.0';
        $query{'openid.ax.mode'} = 'fetch_request';
    }
    my $google_url = URI->new('https://www.google.com/accounts/o8/ud');
    $google_url->query_form(%query);
    my $check_url = $google_url->as_string;
    $c->redirect($check_url);
}

sub callback {
    my ($self, $c) = @_;

    my $request = $c->req->parameters->mixed;

    my $account = $c->account;

    Net::OpenID::Consumer::Lite->handle_server_response(
        $request => (
            not_openid => sub {
                die "Not an OpenID message";
            },
            setup_required => sub {
                my $setup_url = shift;
                $c->redirect($setup_url);
            },
            cancelled => sub {
                $c->redirect('/', { google_cancelled => 1 });
            },
            verified => sub {
                my $vident = shift;
                my $code = $c->req->param('openid.ext1.value.email');
                my ($screen_name, $domain) = split '@', $code;
                my $icon = 'https://secure.gravatar.com/avatar/' . md5_hex($code);
                my $google_account = $c->db->single('google_account', {
                    code => $code
                });

                # 既存のアカウント
                if ($google_account) {

                    # 引越し
                    if ($account && $account->account_id != $google_account->account_id) {
                        $google_account->update({
                            account_id => $account->account_id,
                            authenticated_on => \'now()'
                        });
                        infof('move google_account %s aid:%s to aid:%s',
                            $code,
                            $google_account->account_id,
                            $account->account_id);
                        $c->session->set('sign', {
                                account_id => $account->account_id,
                                code       => $code,
                                name       => $account->data->{name},
                                icon       => $account->data->{icon}
                        });
                        $c->session->set('notice', 'google_account_move');
                    }

                    # 通常サインイン
                    else {
                        $google_account->update({
                            authenticated_on => \'now()'
                        });
                        infof('signin from google %s', $code);
                        $account ||= $c->db->single('account', { account_id => $google_account->account_id });
                        $c->session->set('sign', {
                                account_id => $google_account->account_id,
                                code       => $code,
                                name       => $account->data->{name},
                                icon       => $account->data->{icon}
                        });
                    }
                } else {

                    # 追加
                    if ($account) {
                        infof('add google_account aid:%s code:%s', $account->account_id, $code);
                        $c->session->set('notice', 'google_account_add');
                    }

                    # 新規作成
                    else {
                        $account = DoubleSpark::API::Account->create($c, $code, $screen_name, $icon);

                        infof('new google_account aid:%s code:%s', $account->account_id, $code);
                        $c->session->set('notice', 'google_account_create');
                    }

                    my $google_account = $c->db->insert('google_account', {
                        account_id       => $account->account_id,
                        code             => $code,
                        name             => $screen_name,
                        data             => {},
                        authenticated_on => \'now()',
                        created_on       => \'now()',
                        updated_on       => \'now()'
                    });

                    $c->session->set('sign', {
                        account_id => $account->account_id,
                        code       => $code,
                        name       => $account->data->{name},
                        icon       => $account->data->{icon}
                    });
                }
                $c->session->regenerate_session_id(1);
                $c->redirect('/');
            },
            error => sub {
                my $error = shift;
                critf('signin.google.callback %s', $error);
                $c->redirect('/', { google_error => 1 });
            }
        )
    );
}

1;
