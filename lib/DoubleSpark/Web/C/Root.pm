package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        $c->account->update({ authenticated_on => \'now()' });
        $c->render('app.tt');
    } else {
        $c->render('index.tt');
    }
}

sub token {
    my ($class, $c) = @_;

    $c->render_json({ token => $c->get_csrf_defender_token });
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
