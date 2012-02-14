package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        if (my $v = $c->session->get('version')) {
            return $c->redirect('/' . $v);
        }
        $c->account->update({ authenticated_on => \'now()' });
        $c->render('app.tt');
    } else {
        $c->session->remove('version');
        $c->render('index.tt');
    }
}

sub v3 {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        $c->account->update({ authenticated_on => \'now()' });
        $c->render('app-v3.tt');
    } else {
        $c->session->set('version', 'v3');
        $c->render('index-v3.tt');
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

sub staff {
    my ($class, $c) = @_;

    $c->render('staff.tt');
}

1;
