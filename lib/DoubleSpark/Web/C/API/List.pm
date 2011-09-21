package DoubleSpark::Web::C::API::List;
use strict;
use warnings;
use DoubleSpark::API::List;

sub create {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::List->create($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub update {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::List->update($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub delete {
    my ($class, $c) = @_;

    my $res = DoubleSpark::API::List->delete($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub clear {
    my ($class, $c) = @_;
    
    my $res = DoubleSpark::API::List->clear($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

1;
