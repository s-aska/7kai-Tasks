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
use Time::HiRes;

__PACKAGE__->load_plugin(qw/Web::JSON/);

sub version { $VERSION }

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
                $_[0] ? decode_json(shift) : {}
            });
            $table->add_deflator('data', sub {
                encode_json(shift)
            });
        }
        $schema
            ->get_table('email_account')
            ->add_inflator('password_saltedhash', sub { '********' });
        $c->{db} = DoubleSpark::DB->new(
            dbh    => $dbh,
            schema => $schema,
        );
    }
    return $c->{db};
}

sub twitter {
    my $c = shift;
    my $conf = $c->config->{Twitter}
      or die "missing configuration for 'Twitter'";
    my $key_file = file($c->base_dir(), $conf->{consumer_key_file});
    my $secret_file = file($c->base_dir(), $conf->{consumer_secret_file});
    die "not found twitter consumer key $key_file" unless -f $key_file;
    die "not found twitter consumer secret $secret_file" unless -f $secret_file;
    $conf->{consumer_key} = $key_file->slurp;
    $conf->{consumer_secret} = $secret_file->slurp;
    return Net::Twitter::Lite->new(%{$conf});
}

sub facebook {
    my $c = shift;
    unless ( defined $c->{facebook} ) {
        my $conf = $c->config->{Facebook}
          or die "missing configuration for 'Facebook'";
        my $key_file = file($c->base_dir(), $conf->{app_id_file});
        my $secret_file = file($c->base_dir(), $conf->{secret_file});
        die "not found facebook app_id $key_file" unless -f $key_file;
        die "not found facebook secret $secret_file" unless -f $secret_file;
        $conf->{app_id} = $key_file->slurp;
        $conf->{secret} = $secret_file->slurp;
        $c->{facebook} = Facebook::Graph->new(%{$conf});
    }
    return $c->{facebook};
}

1;
