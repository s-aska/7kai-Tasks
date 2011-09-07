package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        my $notice = $c->session->remove('notice');
        $c->render('app.tt', { sign => $sign, notice => $notice });
    } else {
        $c->render('index.tt');
    }
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
