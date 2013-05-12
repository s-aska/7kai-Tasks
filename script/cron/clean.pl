#!/usr/bin/env perl

use strict;
use warnings;
use File::Spec;
use File::Basename;
use lib File::Spec->catdir(dirname(__FILE__), '../../lib');
use DoubleSpark;
use Log::Minimal;
my $c = DoubleSpark->bootstrap();

my $request_log = $c->db->delete('request_log', { timestamp => { '<' => time - 600 } });

infof('clean request_log: %s records.', $request_log) if $request_log;
