package DoubleSpark::Web::C::API::Contact;
use strict;
use warnings;
use Log::Minimal;

sub facebook {
    my ($class, $c) = @_;

    my $fb_account = $c->session->get('fb_account');

    return $c->res_403() unless $fb_account;

    $c->render_json({
        success => 1,
        friends => $fb_account->{friends}
    });
}

1;
