package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    if ($c->req->param('dev')) {
        if (my $sign = $c->sign) {
            $c->account->update({ authenticated_on => \'now()' });
            $c->render('app-dev.tt', { sign => $sign });
        } else {
            $c->render('index-dev.tt');
        }
    } else {
        if (my $sign = $c->sign) {
            $c->account->update({ authenticated_on => \'now()' });
            $c->render('app.tt', { sign => $sign });
        } else {
            $c->render('index.tt');
        }
    }
}

sub token {
    my ($class, $c) = @_;

    $c->render_json({ token => $c->get_csrf_defender_token });
}

sub index2 {
    my ($class, $c) = @_;

    $c->render('index2.tt');
}

sub mock {
    my ($class, $c) = @_;
    $c->render('app.tt');
}

sub signout {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        infof("[%s] sign out", $sign->{name});
    }
    $c->session->expire;
    $c->redirect('/');
}

1;
