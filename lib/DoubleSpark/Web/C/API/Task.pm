package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use DoubleSpark::Account;

sub create {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $registrant = $c->req->param('registrant');
    my $title = $c->req->param('title');
    my $description = $c->req->param('description');
    my $due = $c->req->param('due');
    my $list_id = $c->req->param('list_id');
    my @assignee = $c->req->param('assignee[]');
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    my $task_id = ++$doc->{last_task_id};
    $doc->{tasks} = [] unless $doc->{tasks};
    my $task = {
        id => $task_id,
        registrant => $registrant,
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
    $task->{assignee} = \@assignee if scalar(@assignee);
    push @{$doc->{tasks}}, $task;
    $c->append_history($doc, {
        code    => $registrant,
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
    my $registrant = $c->req->param('registrant');
    my $list_id = $c->req->param('list_id');
    my $task_id = $c->req->param('task_id');
    
    my $success;
    my $target_task;
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
            if ($c->req->param('assignee[]')) {
                $task->{assignee} = [ $c->req->param('assignee[]') ];
            } elsif (defined $c->req->param('assignee')) {
                $task->{assignee} = [];
            }
            $task->{updated} = time;
            $target_task = $task;
            $success++;
            last;
        }
    }
    die 'NotFound' unless $success;
    $c->append_history($doc, {
        code    => $registrant,
        action  => 'update-task',
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
