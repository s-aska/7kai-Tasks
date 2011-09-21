package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use DoubleSpark::API::Task;

sub create {
    my ($class, $c) = @_;
    
    my $res = DoubleSpark::API::Task->create($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub update {
    my ($class, $c) = @_;
    
    my $res = DoubleSpark::API::Task->update($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

sub move {
    my ($class, $c) = @_;
    
    my $res = DoubleSpark::API::Task->move($c, $c->req);
    
    return $c->res_403() unless $res;
    
    $c->render_json($res);
}

1;
