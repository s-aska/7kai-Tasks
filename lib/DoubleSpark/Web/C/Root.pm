package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    my $base = $c->req->param('mobile') || $c->req->user_agent=~/iPhone|Android/ ? 'mobile/' : '';

    if (my $sign = $c->sign) {
        $c->account->update({ authenticated_on => \'now()' });
        my $notice = $c->session->remove('notice');
        $c->render($base . 'app.tt', { sign => $sign, notice => $notice });
    } else {
        $c->render($base . 'index.tt');
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
