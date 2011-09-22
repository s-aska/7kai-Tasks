package DoubleSpark::Validator::Query;
use strict;
use warnings;

sub new {
    my ($class, $params) = @_;

    if (ref $params eq 'ARRAY') { # jQuery's serializeArray()
        my %params;
        for (@{ $params }) {
            next if ref $_ ne 'HASH';
            if (exists $params{ $_->{name} }) {
                unless (ref $params{ $_->{name} }) {
                    $params{ $_->{name} } = [ $params{ $_->{name} } ];
                }
                push @{ $params{ $_->{name} } }, $_->{value};
            } else {
                $params{ $_->{name} } = $_->{value};
            }
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
