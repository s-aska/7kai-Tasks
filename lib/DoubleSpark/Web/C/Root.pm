package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        $c->account->update({ authenticated_on => \'now()' });
        $c->render('app-v3.tt');
    } else {
        $c->render('index-v3.tt');
    }
}

sub v2 {
    my ($class, $c) = @_;

    if (my $sign = $c->sign) {
        $c->account->update({ authenticated_on => \'now()' });
        $c->render('app.tt');
    } else {
        $c->render('index-v3.tt');
    }
}

sub join {
    my ($class, $c) = @_;

    return $c->res_404() unless $c->{args}->{list_id}=~/^[0-9]+$/;
    return $c->res_404() unless $c->{args}->{invite_code}=~/^[a-zA-Z0-9]{16}$/;

    $c->session->set('invite', {
        list_id     => $c->{args}->{list_id},
        invite_code => $c->{args}->{invite_code}
    });

    $c->redirect('/');
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
