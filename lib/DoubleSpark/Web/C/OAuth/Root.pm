package DoubleSpark::Web::C::OAuth::Root;
use strict;
use warnings;
use Log::Minimal;
use DoubleSpark::OAuth;
use String::Random qw(random_regex);

sub request_token {
    my ($class, $c) = @_;

    my $oauth = DoubleSpark::OAuth->new;
    my $token = $oauth->get_request_token($c) or return $c->res_401($oauth->error);

    $c->render_string($token->as_encoded);
}

sub access_token {
    my ($class, $c) = @_;

    my $oauth = DoubleSpark::OAuth->new;
    my $token = $oauth->get_access_token($c) or return $c->res_401($oauth->error);

    $c->render_string($token->as_encoded);
}

sub authorize {
    my ($class, $c) = @_;

    my $db = $c->db;
    my $req = $c->req;
    my $oauth_token = $req->param('oauth_token') or return $c->res_401('missing oauth_token.');
    my ($request_token_id, $token) = split '-', $oauth_token;

    my $request_token = $db->single('request_token', {
        request_token_id => $request_token_id,
        token => $token
    }) or return $c->res_401('missing request token.');

    my $app = $db->single('app', {
        app_id => $request_token->app_id
    }) or return $c->res_401('missing app');

    my $callback_url = $request_token->callback_url || $app->callback_url;

    # confirm
    if ($req->method ne 'POST') {
        if ($request_token->is_authorized_by_user) {
            #
        } else {
            return $c->render('oauth/authorize.tt', { app => $app, oauth_token => $oauth_token, callback_url => $callback_url });
        }
    } else {

        # cancel
        if ($req->param('cancel')) {
            $request_token->delete();
            if ($callback_url) {
                return $c->redirect($callback_url);
            } else {
                return $c->render('oauth/cancel.tt', { app => $app });
            }
        }

        # authorized
        else {
            $request_token->update({
                verifier              => random_regex('\d{7}'),
                account_id            => $c->sign_id,
                is_authorized_by_user => 1,
                authenticated_on      => \'now()',
                updated_on            => \'now()',
            });
        }
    }

    # redirect
    if ($callback_url) {
        return $c->redirect($callback_url, { oauth_verifier => $request_token->verifier });
    } else {
        return $c->render('oauth/done.tt', { app => $app, verifier => $request_token->verifier });
    }
}



1;
