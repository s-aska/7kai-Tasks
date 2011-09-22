package DoubleSpark::Validator::Query;
use strict;
use warnings;

sub new {
    my ($class, $params) = @_;

    if (ref $params eq 'ARRAY') { # jQuery's serializeArray()
        my %params;
        for (@{ $params }) {
            next if ref $_ ne 'HASH';
            $params{ $_->{name} } = $_->{value};
        }
        $params = \%params;
    }

    return bless $params, $class;
}

sub param {
    my ($self, $key) = @_;

    return unless exists $self->{$key};
    return ref $self->{$key} ? @{ $self->{$key} } : $self->{$key};
}

1;
