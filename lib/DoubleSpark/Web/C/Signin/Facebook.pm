package DoubleSpark::Web::C::Signin::Facebook;
use strict;
use warnings;
use DoubleSpark::API::Account;
use Log::Minimal;

sub signin {
    my( $self, $c ) = @_;

    my $mode = $c->req->param('mode') || 'signin';
    $c->session->set('fb_request_mode', $mode);

    my $fb = $c->facebook;
    my $url = $fb->authorize->uri_as_string;

    $c->redirect($url);
}

sub callback {
    my( $self, $c ) = @_;

    my $mode = $c->session->get('fb_request_mode');
    unless ($mode) {
        warnf('missing mode.');
        return $c->redirect('/', { fb_missing => 1 });
    }

    my $account = $c->account;
    if ($account && $mode eq 'signin') {
        warnf('signed.');
        return $c->redirect('/', { fb_signed => 1 });
    }

    eval {

        my $fb = $c->facebook;
        $fb->request_access_token($c->req->param('code'));
        my $access_token = $fb->access_token;
        my $user = $fb->fetch('me');
        my $friends = $fb->fetch('me/friends');
        my $code = 'fb-' . $user->{id};
        my $name = $user->{name};
        my $icon = sprintf 'https://graph.facebook.com/%s/picture', $user->{id};

        my @friends;
        for (@{ $friends->{data} }) {
            push @friends, {
                code => 'fb-' . $_->{id},
                name => $_->{name}
            };
        }

        my $fb_account = $c->db->single('fb_account', {
            code => $code
        });

        # 既存FBアカウント
        if ($fb_account) {

            # update
            $fb_account->update({
                name             => $name,
                data             => { friends => \@friends },
                authenticated_on => \'now()'
            });

            # 移行
            if ($account && $account->account_id != $fb_account->account_id) {
                $fb_account->update({ account_id => $account->account_id });
                infof('move fb_account %s aid:%s to aid:%s',
                    $name,
                    $fb_account->account_id,
                    $account->account_id);
                $c->session->set('notice', 'fb_account_move');
                $c->session->set('sign', {
                        account_id => $account->account_id,
                        code       => $code,
                        name       => $name,
                        icon       => $icon
                });
            } else {
                infof('signin from facebook %s', $name);
                $c->session->set('sign', {
                        account_id => $fb_account->account_id,
                        code       => $code,
                        name       => $name,
                        icon       => $icon
                });
            }
        }

        # 新規FBアカウント
        else {

            # 追加
            if ($account) {
                infof('add fb_account aid:%s tw:%s', $account->account_id, $name);
                $c->session->set('notice', 'fb_account_add');
            }

            # 新規作成
            else {
                $account = DoubleSpark::API::Account->create($c, $code, $name, $icon);
                infof('new fb_account aid:%s fb:%s', $account->account_id, $name);
                $c->session->set('notice', 'fb_account_create');
            }

            my $fb_account = $c->db->insert('fb_account', {
                account_id       => $account->account_id,
                code             => $code,
                name             => $name,
                data             => { friends => \@friends },
                authenticated_on => \'now()',
                created_on       => \'now()',
                updated_on       => \'now()'
            });

            $c->session->set('sign', {
                account_id => $account->account_id,
                code       => $code,
                name       => $name,
                icon       => $icon
            });
        }
    };if ($@) {
        critf('signin.facebook.callback %s', $@);
        $c->redirect('/', { facebook_error => 1 });
    } else {
        $c->session->remove('fb_request_mode');
        $c->session->regenerate_session_id(1);
        $c->redirect('/');
    }
}

1;
