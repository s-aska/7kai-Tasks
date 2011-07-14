package DoubleSpark::Web::C::Root;
use strict;
use warnings;
use DoubleSpark::Account;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;
    $c->render('signin.tt');
}

sub signout {
    my ($class, $c) = @_;
    $c->session->expire;
    $c->redirect('/');
}

sub viewer {
    my ($class, $c) = @_;

    if ($c->session->get('tw_account')) {
        DoubleSpark::Account->new($c);
    }

    if ($c->session->get('account')) {
        infof("logined " . $c->session->get('screen_name'));
        
        my $tmpl = $c->req->param('tmpl') || 'mock2';
        
        $c->render("chrome/$tmpl.tt", {
            screen_name => $c->session->get('screen_name'),
            profile_image_url => $c->session->get('profile_image_url')
        });
    } else {
        $c->redirect('/');
    }
}

1;
