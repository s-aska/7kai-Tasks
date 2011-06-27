package DoubleSpark;
use strict;
use warnings;
use parent qw/Amon2/;
our $VERSION='1.01';
use 5.008001;

use AnyEvent::CouchDB ();
use Facebook::Graph;
#use Net::Dropbox::API;
use Net::Twitter::Lite;
#use Scope::Container;
use Path::Class;
use Sub::Retry;
use Teng;
use Teng::Schema::Loader;

__PACKAGE__->load_plugin(qw/Web::JSON/);

sub version { $VERSION }

sub db {
    my $self = shift;
    if ( !defined $self->{db} ) {
        my $conf = $self->config->{DB}
          or die "missing configuration for 'DB'";
        my $dbh = DBI->connect(@$conf);
        my $schema = Teng::Schema::Loader->load(
            namespace => 'DoubleSpark::DB',
            dbh       => $dbh,
        );
        $self->{db} = Teng->new(
            dbh    => $dbh,
            schema => $schema,
        );
    }
    return $self->{db};
}

sub couchdb {
    my $self = shift;
    if ( !defined $self->{couchdb} ) {
        my $conf = $self->config->{CouchDB}
          or die "missing configuration for 'CouchDB'";
        $self->{couchdb} = AnyEvent::CouchDB::couchdb($conf->{uri});
    }
    return $self->{couchdb};
}

sub twitter {
    my $self = shift;
    if ( !defined $self->{twitter} ) {
        my $conf = $self->config->{Twitter}
          or die "missing configuration for 'Twitter'";
          my $key_file = file($self->base_dir(), $conf->{consumer_key_file});
          my $secret_file = file($self->base_dir(), $conf->{consumer_secret_file});
        die "not found twitter consumer key $key_file" unless -f $key_file;
        die "not found twitter consumer secret $secret_file" unless -f $secret_file;
        $conf->{consumer_key} = $key_file->slurp;
        $conf->{consumer_secret} = $secret_file->slurp;
        return Net::Twitter::Lite->new(%{$conf});
        #$self->{twitter} = Net::Twitter::Lite->new(%{$conf});
    }
    return $self->{twitter};
}

sub facebook {
    my $self = shift;
    if ( !defined $self->{facebook} ) {
        my $conf = $self->config->{Facebook}
          or die "missing configuration for 'Facebook'";
        $self->{facebook} = Facebook::Graph->new(%{$conf});
    }
    return $self->{facebook};
}

sub open_doc {
    my ($self, @args) = @_;
    retry 3, 1, sub {
        $self->couchdb->open_doc(@args)->recv;
    };
}

sub open_docs {
    my ($self, @args) = @_;
    retry 3, 1, sub {
        $self->couchdb->open_docs(@args)->recv;
    };
}

sub save_doc {
    my ($self, @args) = @_;
    retry 3, 1, sub {
        $self->couchdb->save_doc(@args)->recv;
    };
}

sub remove_doc {
    my ($self, @args) = @_;
    retry 3, 1, sub {
        $self->couchdb->remove_doc(@args)->recv;
    };
}

sub open_list_doc {
    my ($self, $account, $role, $id) = @_;
    my $doc = $self->open_doc($id);
    my $check = 'has_role_' . $role;
    die 'Forbidden' unless $account->$check($doc);
    return $doc;
}

sub open_list_docs {
    my ($self, $account, $role, $ids) = @_;
    my $res = $self->open_docs($ids);
    die 'NotFond' unless $res && $res->{rows} && scalar(@{$res->{rows}});
    my $docs = $res->{rows};
    my $check = 'has_role_' . $role;
    for my $doc (@$docs) {
        die 'Forbidden' unless $account->$check($doc->{doc});
    }
    return $docs;
}

sub splice_history {
    my ($self, $doc) = @_;
    my $max_history = $self->config->{max_history} || 10;
    if (scalar(@{$doc->{history}}) > $max_history) {
        @{$doc->{history}} =
            splice(@{$doc->{history}}, scalar(@{$doc->{history}}) - $max_history);
    }
}

1;
