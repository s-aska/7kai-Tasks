#!/usr/bin/env perl

use strict;
use warnings;
use DBI;
use DoubleSpark;
use Teng::Schema::Dumper;

my $c = DoubleSpark->bootstrap();
my $json = <<'EOF';
    inflate 'data' => sub {
        return $_[0] ? decode_json(shift) : {};
    };
    deflate 'data' => sub {
        return encode_json(shift);
    };
EOF
my $pass = <<'EOF';
    inflate 'password_saltedhash' => sub { '********' };
EOF
my $dbh = DBI->connect(@{ $c->config->{DB} }) or die;
my $source = Teng::Schema::Dumper->dump(
    dbh       => $dbh,
    namespace => 'DoubleSpark::DB',
    inflate   => +{
        account        => $json,
        fb_account     => $json,
        google_account => $json,
        list           => $json,
        question       => $json,
        request        => $json,
        tw_account     => $json,
        email_account  => $pass,
    },
);
$source =~ s|use Teng::Schema::Declare;|use Teng::Schema::Declare;\nuse JSON::XS;\n|;
print $source;