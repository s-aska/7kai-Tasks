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
    # if (!$doc->{name}) {
    #     say $doc->{owner};
    # }
    # $doc->{history} ||= [];
    # for my $task (@{$doc->{tasks}}) {
    #     unless ($task->{assignee}) {
    #         say $doc->{_id}, " ", $doc->{owner}, " ", $task->{id};
    #         $task->{assignee} = [];
    #     }
    	# delete $task->{sort};
    	# $task->{sort} = $task->{id};
        # delete $task->{created_on};
        # delete $task->{updated_on};
        # $task->{created} ||= time;
        # $task->{updated} ||= time;
        # $task->{assignee} ||= [];
        # $task->{registrant} ||= $doc->{owner};
    # }
    for my $history (@{$doc->{history}}) {
        $history->{action}=~s|\.|-|g;
        say $history->{action};
    	# delete $task->{sort};
    	# $task->{sort} = $task->{id};
        # delete $task->{created_on};
        # delete $task->{updated_on};
        # $task->{created} ||= time;
        # $task->{updated} ||= time;
        # $task->{assignee} ||= [];
        # $task->{registrant} ||= $doc->{owner};
    }
    $c->save_doc($doc);
}

exit(0);
