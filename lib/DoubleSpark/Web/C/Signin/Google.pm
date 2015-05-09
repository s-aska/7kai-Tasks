package DoubleSpark::Web::C::Signin::Google;
use strict;
use warnings;
use DoubleSpark::API::Account;
use Net::OpenID::Consumer::Lite;
use Log::Minimal;
use Digest::MD5 qw(md5_hex);
use String::Random qw(random_regex);
use Furl;
use Path::Class;
use JSON::XS;

my $furl = Furl->new(
    agent   => '7kai Tasks',
    timeout => 10,
);
my $json = JSON::XS->new->ascii;

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

    my $state = random_regex('[a-zA-Z0-9]{24}');
    my %query = (
        client_id     => file($c->base_dir(), $config->{OpenID}->{client_id_file})->slurp,
        scope         => 'openid profile email ',
        response_type => 'code',
        state         => $state,
        redirect_uri  => $config->{OpenID}->{return_to},
        openid_realm  => $config->{OpenID}->{realm},
    );
    $c->session->set('state', $state);
    my $google_url = URI->new('https://accounts.google.com/o/oauth2/auth');
    $google_url->query_form(%query);
    my $check_url = $google_url->as_string;
    $c->redirect($check_url);
}

sub callback {
    my ($self, $c) = @_;

    my $config = $c->config;
    my $account = $c->account;
    my $next_url = $c->session->remove('next_url') || '/';

    my $request_state = $c->req->param('state') // '';
    my $session_state = $c->session->get('state') // '';
    if ($session_state ne $request_state) {
        $c->redirect('/', { google_error => 'state is invalid.' });
    }

    if (my $error = $c->req->param('error')) {
        critf('signin.google.callback %s', $error);
        $c->redirect('/', { google_error => $error });
    }

    my $res = $furl->post('https://accounts.google.com/o/oauth2/token', [], {
        code          => $c->req->param('code') // '',
        client_id     => file($c->base_dir(), $config->{OpenID}->{client_id_file})->slurp,
        client_secret => file($c->base_dir(), $config->{OpenID}->{client_secret_file})->slurp,
        redirect_uri  => $config->{OpenID}->{return_to},
        grant_type    => 'authorization_code',
    });

    unless ($res->is_success) {
        $c->redirect('/', { google_error => 2 });
    }

    my $data = $json->decode($res->decoded_content);
    my $profile_res = $furl->get('https://www.googleapis.com/plus/v1/people/me/openIdConnect', [
        'Authorization', 'OAuth ' . $data->{access_token}
    ]);

    unless ($profile_res->is_success) {
        $c->redirect('/', { google_error => 3 });
    }

    my $profile = $json->decode($profile_res->decoded_content);

    my $code        = $profile->{email};
    my $icon        = $profile->{picture};
    my $screen_name = $profile->{name};

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
    $c->redirect($next_url);
}

1;
