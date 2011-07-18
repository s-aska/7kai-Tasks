package DoubleSpark::Web::C::Signin::Twitter;
use strict;
use warnings;

sub oauth {
    my ($class, $c) = @_;
    
    my $nt = $c->twitter;
    my $url = $nt->get_authentication_url(callback => $c->config->{Twitter}->{callback});
    
    $c->session->set('tw_request', {
        request_token        => $nt->request_token,
        request_token_secret => $nt->request_token_secret
    });
    
    $c->redirect($url);
}

sub callback {
    my ($class, $c) = @_;

    if ($c->session->get('tw_account')) {
        return $c->redirect('/chrome/viewer');
    }

    my $tw_request = $c->session->remove('tw_request');
    unless ($tw_request) {
        if ($c->session->get('account')) {
            return $c->redirect('/chrome/viewer');
        } else {
            return $c->redirect('/signin/twitter/oauth');
        }
    }

    my $nt = $c->twitter;
    $nt->request_token($tw_request->{request_token});
    $nt->request_token_secret($tw_request->{request_token_secret});
    
    my $verifier = $c->req->param('oauth_verifier');
    unless ($verifier) {
        return $c->redirect('/');
    }

    my ($access_token, $access_token_secret, $user_id, $screen_name) =
        $nt->request_access_token(verifier => $verifier);
    
    my $res = $nt->show_user($user_id);
    
    $c->session->set('tw_account', {
        user_id => $user_id,
        name => $res->{name} || '',
        screen_name => $screen_name,
        profile_image_url => $res->{profile_image_url} || ''
    });
    
    $c->session->regenerate_session_id(1);
    
    $c->redirect('/chrome/viewer');
}

1;
