use strict;
use AnyEvent::CouchDB;
use Facebook::Graph;
use Net::Dropbox::API;
use Net::Twitter::Lite;

register( 'CouchDB' => sub {
    my $c = shift;
    my $config = $c->get('config');
    die 'please set CouchDB uri' unless $config->{CouchDB}->{uri};
    warn "new CouchDB instance";
    return couchdb($config->{CouchDB}->{uri});
}, { persistent => 0 });

register( 'Twitter' => sub {
    my $c = shift;
    my $config = $c->get('config');
    die 'please set Twitter consumer_key' unless $config->{Twitter}->{consumer_key};
    die 'please set Twitter consumer_secret' unless $config->{Twitter}->{consumer_secret};
    return Net::Twitter::Lite->new(%{$config->{Twitter}});
}, { persistent => 0 });

register( 'Facebook' => sub {
    my $c = shift;
    my $config = $c->get('config');
    die 'please set Facebook app_id' unless $config->{Facebook}->{app_id};
    die 'please set Facebook secret' unless $config->{Facebook}->{secret};
    return Facebook::Graph->new(%{$config->{Facebook}});
}, { persistent => 0 });

1;