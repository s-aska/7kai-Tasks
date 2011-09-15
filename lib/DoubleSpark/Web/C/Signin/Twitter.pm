package DoubleSpark::Web::C::Signin::Twitter;
use strict;
use warnings;
use Log::Minimal;
use JSON::XS;

sub signin {
    my ($class, $c) = @_;

    my $mode = $c->req->param('mode') || 'signin';

    my $nt = $c->twitter;
    my $url = $nt->get_authentication_url(callback => $c->config->{Twitter}->{callback});
    $c->session->set('tw_request', {
        mode                 => $mode,
        request_token        => $nt->request_token,
        request_token_secret => $nt->request_token_secret
    });
    infof('create twitter oauth session mode=[%s]', $mode);

    $c->redirect($url);
}

sub callback {
    my ($class, $c) = @_;

    my $tw_request = $c->session->remove('tw_request');
    unless ($tw_request) {
        if ($c->session->get('account')) {
            warnf('missing twitter oauth session and signed.');
            return $c->redirect('/');
        } else {
            warnf('missing twitter oauth session.');
            return $c->redirect('/', { twitter_missign => 1 });
        }
    }

    my $verifier = $c->req->param('oauth_verifier');
    unless ($verifier) {
        warnf('denied twitter oauth.');
        return $c->redirect('/', { twitter_denied => 1 });
    }

    my $account = $c->account;
    if ($account && $tw_request->{mode} eq 'signin') {
        warnf('signed.');
        return $c->redirect('/', { twitter_signed => 1 });
    }

    eval {
        my $nt = $c->twitter;
        $nt->request_token($tw_request->{request_token});
        $nt->request_token_secret($tw_request->{request_token_secret});

        my ($access_token, $access_token_secret, $user_id, $screen_name) =
            $nt->request_access_token(verifier => $verifier);

        my $code = "tw-$user_id";
        my $user = $nt->show_user($user_id);
        my $icon = $user->{profile_image_url};

        my $tw_account = $c->db->single('tw_account', { code => $code });

        # 既存Twアカウント
        if ($tw_account) {

            $tw_account->data->{icon} = $icon;
            $tw_account->update({
                name             => $screen_name,
                data             => $tw_account->data,
                authenticated_on => \'now()'
            });

            # 移行
            if ($account && $account->account_id != $tw_account->account_id) {
                $tw_account->update({ account_id => $account->account_id });
                infof('move tw_account %s aid:%s to aid:%s',
                    $screen_name,
                    $tw_account->account_id,
                    $account->account_id);
                $c->session->set('sign', {
                        account_id => $account->account_id,
                        code       => $code,
                        name       => $screen_name,
                        icon       => $icon
                });
                $c->session->set('notice', 'tw_account_move');
            } else {
                infof('signin from twitter %s', $screen_name);
                $c->session->set('sign', {
                        account_id => $tw_account->account_id,
                        code       => $code,
                        name       => $screen_name,
                        icon       => $icon
                });
            }
        }

        # 新規Twアカウント
        else {

            # 追加
            if ($account) {
                infof('add tw_account aid:%s tw:%s', $account->account_id, $screen_name);
                $c->session->set('notice', 'tw_account_add');
            }

            # 新規作成
            else {
                $account = $c->create_account($code, $screen_name, $icon);
                infof('new tw_account aid:%s tw:%s', $account->account_id, $screen_name);
                $c->session->set('notice', 'tw_account_create');
            }

            my $tw_account = $c->db->insert('tw_account', {
                account_id       => $account->account_id,
                code             => $code,
                name             => $screen_name,
                data             => { icon => $icon },
                authenticated_on => \'now()',
                created_on       => \'now()',
                updated_on       => \'now()'
            });

            $c->session->set('sign', {
                account_id => $account->account_id,
                code       => $code,
                name       => $screen_name,
                icon       => $icon
            });
        }
    };if ($@) {
        critf('signin.twitter.callback %s', $@);
        $c->redirect('/', { twitter_error => 1 });
    } else {
        $c->session->regenerate_session_id(1);
        $c->redirect('/');
    }
}

1;
