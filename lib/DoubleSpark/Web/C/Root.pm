package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use DoubleSpark::Account;

sub index {
    my ($class, $c) = @_;
    $c->render('signin.tt');
}

sub signout {
    my ($self, $c) = @_;
    $c->session->expire;
    $c->redirect('/');
}

sub viewer {
    my ($class, $c) = @_;

    my $account = DoubleSpark::Account->new($c);
    if ($account) {
        $c->render('chrome/mock.tt', {
            screen_name => $c->session->get('screen_name'),
            profile_image_url => $c->session->get('profile_image_url')
        });
    } else {
        $c->redirect('/');
    }
}

1;
