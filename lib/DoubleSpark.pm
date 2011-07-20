package DoubleSpark;
use strict;
use warnings;
use parent qw/Amon2/;
our $VERSION='1.11';
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
    return $self->res_403() unless $account->$check($doc);
    return $doc;
}

sub open_list_docs {
    my ($self, $account, $role, $ids) = @_;
    my $res = $self->open_docs($ids);
    return $self->res_404() unless $res && $res->{rows} && scalar(@{$res->{rows}});
    my $docs = $res->{rows};
    my $check = 'has_role_' . $role;
    for my $doc (@$docs) {
        return $self->res_403() unless $account->$check($doc->{doc});
    }
    return $docs;
}

sub save_list_doc {
    my ($self, $account, $doc) = @_;
    
    my $res = $self->save_doc($doc);
    my $rev = $res->{rev};
    my $id = $res->{id};
    my $time = $self->req->param('request_time');
    my $account_doc = $account->to_hashref;
    $account_doc->{state}->{read}->{list}->{$id} =
        $rev . ',' . $time;
    $self->save_doc($account_doc);
}

sub lang {
    my ($c) = @_;
    my $lang = $c->req->param('lang') || $c->req->header('accept-language') || '';
    return 'ja' if $lang=~/^ja/;
    return 'en';
}

sub res_403 {
    my $self = shift;
    my $content = 'Forbidden';
    $self->create_response(
        403,
        [
            'Content-Type' => 'text/html; charset=utf-8',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

1;
