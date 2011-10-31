#!/usr/bin/env perl

use strict;
use warnings;
use feature qw/say/;

use DoubleSpark;
use Data::Dumper;
binmode STDOUT, ":utf8";
my $c = DoubleSpark->bootstrap();
say $c->config->{DB}->[0];
print "OK? [y/n]: ";
chomp( my $yes = <STDIN> );
if ($yes ne 'y') {
    say "cancel.";
    exit;
}
my $lists = $c->db->search('list');
for my $list ($lists->all) {
    for my $task (@{ $list->data->{tasks} }) {
        
        my @actions;
        for my $comment (@{ $task->{comments} }) {
            push @actions, {
                id      => $comment->{id},
                action  => 'comment',
                code    => $comment->{code},
                time    => $comment->{time},
                message => $comment->{message}
            };
        }
        
        for my $history (@{ $task->{history} }) {
            push @actions, {
                action => $history->{action},
                code   => $history->{code},
                time   => $history->{time}
            };
        }
        
        delete $task->{comments};
        delete $task->{history};
        
        @actions = sort {
            $a->{time} <=> $b->{time}
        } @actions;
        
        $task->{actions} = \@actions;
    }
    
    $list->update({ data => $list->data });
}

exit(0);
