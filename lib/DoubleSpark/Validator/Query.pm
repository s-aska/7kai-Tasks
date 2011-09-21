package DoubleSpark::Validator::Query;
use strict;
use warnings;

sub new {
    my ($class, $params) = @_;
    
    return bless $params, $class;
}

sub param {
    my ($self, $key) = @_;
    
    return unless exists $self->{$key};
    return ref $self->{$key} ? @{ $self->{$key} } : $self->{$key};
}

1;
