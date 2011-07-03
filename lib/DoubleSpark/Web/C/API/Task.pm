package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use DoubleSpark::Account;

sub create {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $registrant_id = $c->req->param('registrant_id');
    my $title = $c->req->param('title');
    my $description = $c->req->param('description');
    my $due = $c->req->param('due');
    my $list_id = $c->req->param('list_id');
    my @assignee_ids = $c->req->param('assignee_ids[]');
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    my $task_id = ++$doc->{last_task_id};
    $doc->{tasks} = [] unless $doc->{tasks};
    my $task = {
        id => $task_id,
        registrant_id => $registrant_id,
        title => $title,
        description => $description,
        due => $due,
        status => 0,
        closed => 0,
        comments => [],
        created => time,
        updated => time,
        sort => $task_id
    };
    $task->{assignee_ids} = \@assignee_ids;
    push @{$doc->{tasks}}, $task;
    $c->append_history($doc, {
        id      => $registrant_id,
        action  => 'create-task',
        task_id => $task_id,
        date    => time
    });
    $c->save_list_doc($account, $doc);
    $c->render_json({
        success => 1,
        task => $task
    });
}

sub update {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $registrant_id = $c->req->param('registrant_id');
    my $list_id = $c->req->param('list_id');
    my $task_id = $c->req->param('task_id');
    
    my $success;
    my $target_task;
    my $action = 'update-task';
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    for my $task (@{$doc->{tasks}}) {
        if ($task->{id} == $task_id) {
            my @keys = qw(status closed title description due);
            for my $key (@keys) {
                my $val = $c->req->param($key);
                if (defined $val) {
                    $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
                }
            }
            my $status = $c->req->param('status');
            my $closed = $c->req->param('closed');
            my $status_action_map = {
                0 => 'reopen-task',
                1 => 'start-task',
                2 => 'fix-task'
            };
            if (defined $status) {
                $action = $status_action_map->{$status};
            } elsif (defined $closed) {
                $action = $closed ? 'close-task' : 're' . $status_action_map->{$task->{status}};
            }
            if ($c->req->param('assignee_ids[]')) {
                my @assignee_ids = $c->req->param('assignee_ids[]');
                $task->{assignee_ids} = \@assignee_ids;
            } elsif (defined $c->req->param('assignee_ids')) {
                $task->{assignee_ids} = [];
            }
            $task->{updated} = time;
            $target_task = $task;
            $success++;
            last;
        }
    }
    die 'NotFound' unless $success;
    $c->append_history($doc, {
        id      => $registrant_id,
        action  => $action,
        task_id => $task_id,
        date    => time
    });
    $c->save_list_doc($account, $doc);
    $c->render_json({
        success => $success,
        task => $target_task
    });
}

1;
