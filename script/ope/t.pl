#!/usr/bin/env perl

use strict;
use warnings;
use feature qw/say/;

use DoubleSpark;
use Data::Dumper;
binmode STDOUT, ":utf8";
my $c = DoubleSpark->bootstrap();
my $lists = $c->db->search('list');
for my $list ($lists->all) {
    my $doc = $c->open_doc('list-' . $list->list_id);
    for my $task (@{$doc->{tasks}}) {
        $task->{history} = [];
        $task->{requester_id} = $task->{registrant_id};
    }
    delete $doc->{admin_ids};
    delete $doc->{members};
    delete $doc->{owner};
    delete $doc->{privacy};
    delete $doc->{history};
    say 'update 1.10 => 1.11';
    $c->save_doc($doc);
}

exit(0);
