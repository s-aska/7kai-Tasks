#!/usr/bin/env perl

use strict;
use warnings;
use feature qw/say/;

use DoubleSpark;
use Data::Dumper;

my $c = DoubleSpark->bootstrap();
my $lists = $c->db->search('list');
for my $list ($lists->all) {
    # warn $list->list_id;
    my $doc = $c->open_doc('list-' . $list->list_id);
    say $list->list_id, ' ', $doc->{name}, ' ', $doc->{owner};
    for my $task (@{$doc->{tasks}}) {
        say $task->{title};
        say $task->{status};
        say $task->{closed};
        
        $task->{status} = int($task->{status});
        $task->{closed} = int($task->{closed});
    }
    say 'update';
    $c->save_doc($doc);
}
# my $accounts = $c->db->search('account');
# for my $account ($accounts->all) {
#     # warn $list->list_id;
#     my $doc = $c->open_doc('account-' . $account->account_id);
#     say $account->account_id;
#     for my $col (qw/checkbox button/) {
#         for (keys %{$doc->{state}->{$col}}) {
#             warn Dumper($doc->{state}->{$col}->{$_});
#             # $doc->{state}->{$col}->{$_} = int($doc->{state}->{$col}->{$_});
#         }
#     }
#     # $c->save_doc($doc);
# }

exit(0);
