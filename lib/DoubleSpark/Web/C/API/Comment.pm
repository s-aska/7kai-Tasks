package DoubleSpark::Web::C::API::Comment;
use strict;
use warnings;
use DoubleSpark::API::Comment;

sub create {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::Comment->create($c, $c->req);

    return $c->res_403() unless $res;

    $c->render_json($res);
}

sub delete {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::Comment->delete($c, $c->req);

    return $c->res_403() unless $res;

    $c->render_json($res);
}

1;
