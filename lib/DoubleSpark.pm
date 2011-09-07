package DoubleSpark;
use strict;
use warnings;
use parent qw/Amon2/;
our $VERSION='1.11';
use 5.008001;

use DoubleSpark::DB;
use Facebook::Graph;
use JSON::XS;
use Log::Minimal;
use Net::Twitter::Lite;
use Path::Class;
use Scope::Container;
use Sub::Retry;
use Teng;
use Teng::Schema::Loader;

__PACKAGE__->load_plugin(qw/Web::JSON/);

sub version { $VERSION }

# sub db_old {
#     my $self = shift;
#     unless ( defined $self->{db} ) {
#         my $conf = $self->config->{DB_OLD}
#           or die "missing configuration for 'DB'";
#         my $dbh = DBI->connect(@$conf);
#         my $schema = Teng::Schema::Loader->load(
#             namespace => 'DoubleSpark::DB',
#             dbh       => $dbh,
#         );
#         $self->{db} = Teng->new(
#             dbh    => $dbh,
#             schema => $schema,
#         );
#     }
#     return $self->{db};
# }
#
sub db {
    my $c = shift;
    unless ( defined $c->{db} ) {
        my $conf = $c->config->{DB}
          or die "missing configuration for 'DB'";
        my $dbh = DBI->connect(@$conf);
        my $schema = Teng::Schema::Loader->load(
            namespace => 'DoubleSpark::DB',
            dbh       => $dbh,
        );
        for my $table (values %{ $schema->tables }) {
            next unless grep /^data$/, @{ $table->columns };
            $table->add_inflator('data', sub {
                decode_json(shift)
            });
            $table->add_deflator('data', sub {
                encode_json(shift)
            });
        }
        $schema
            ->get_table('email_account')
            ->add_inflator('password_saltedhash', sub { '********' });
        $c->{db} = Teng->new(
            dbh    => $dbh,
            schema => $schema,
        );
    }
    return $c->{db};
}

sub twitter {
    my $c = shift;
    # unless ( defined $c->{twitter} ) {
        my $conf = $c->config->{Twitter}
          or die "missing configuration for 'Twitter'";
          my $key_file = file($c->base_dir(), $conf->{consumer_key_file});
          my $secret_file = file($c->base_dir(), $conf->{consumer_secret_file});
        die "not found twitter consumer key $key_file" unless -f $key_file;
        die "not found twitter consumer secret $secret_file" unless -f $secret_file;
        $conf->{consumer_key} = $key_file->slurp;
        $conf->{consumer_secret} = $secret_file->slurp;
        return Net::Twitter::Lite->new(%{$conf});
    #     $c->{twitter} = Net::Twitter::Lite->new(%{$conf});
    # }
    # return $c->{twitter};
}

sub facebook {
    my $c = shift;
    unless ( defined $c->{facebook} ) {
        my $conf = $c->config->{Facebook}
          or die "missing configuration for 'Facebook'";
        $c->{facebook} = Facebook::Graph->new(%{$conf});
    }
    return $c->{facebook};
}

sub create_account {
    my ($c, $code, $name) = @_;
    
    my $account = $c->db->insert('account', {
        data       => $c->config->{Skeleton}->{Account},
        created_on => \'now()',
        updated_on => \'now()'
    });
    $c->db->insert('list', {
        code       => $code,
        data       => {
            name    => "${name}'s list",
            owner   => $code,
            members => [],
            tasks   => []
        },
        created_on => \'now()',
        updated_on => \'now()'
    });
    return $account;
}

# sub open_doc {
#     my ($self, @args) = @_;
#     retry 3, 1, sub {
#         $self->couchdb->open_doc(@args)->recv;
#     };
# }
#
# sub open_docs {
#     my ($self, @args) = @_;
#     retry 3, 1, sub {
#         $self->couchdb->open_docs(@args)->recv;
#     };
# }
#
# sub save_doc {
#     my ($self, @args) = @_;
#     retry 3, 1, sub {
#         $self->couchdb->save_doc(@args)->recv;
#     };
# }
#
# sub remove_doc {
#     my ($self, @args) = @_;
#     retry 3, 1, sub {
#         $self->couchdb->remove_doc(@args)->recv;
#     };
# }
#
# sub open_list_doc {
#     my ($self, $account, $role, $id) = @_;
#     my $doc = $self->open_doc($id);
#     my $check = 'has_role_' . $role;
#     return $self->res_403() unless $account->$check($doc);
#     return $doc;
# }
#
# sub open_list_docs {
#     my ($self, $account, $role, $ids) = @_;
#     my $res = $self->open_docs($ids);
#     return $self->res_404() unless $res && $res->{rows} && scalar(@{$res->{rows}});
#     my $docs = $res->{rows};
#     my $check = 'has_role_' . $role;
#     for my $doc (@$docs) {
#         return $self->res_403() unless $account->$check($doc->{doc});
#     }
#     return $docs;
# }
#
# sub save_list_doc {
#     my ($self, $account, $doc) = @_;
#
#     my $res = $self->save_doc($doc);
#     my $rev = $res->{rev};
#     my $id = $res->{id};
#     my $time = $self->req->param('request_time');
#     my $account_doc = $account->to_hashref;
#     $account_doc->{state}->{read}->{list}->{$id} =
#         $rev . ',' . $time;
#     $self->save_doc($account_doc);
# }

# sub res_404 {
#     die { code => 404, no_print_errors => 1 };
# }
# 
# sub res_403 {
#     die { code => 403, no_print_errors => 1 };
# }

1;

