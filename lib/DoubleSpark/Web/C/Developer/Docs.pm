package DoubleSpark::Web::C::Developer::Docs;
use strict;
use warnings;

sub api {
    my ($class, $c) = @_;

    $c->render('developer/docs/api.tt');
}

1;
