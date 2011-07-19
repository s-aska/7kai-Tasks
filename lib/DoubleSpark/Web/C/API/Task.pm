package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use DoubleSpark::Account;
use Log::Minimal;

sub create {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $requester_id = $c->req->param('requester_id');
    my $registrant_id = $c->req->param('registrant_id');
    my $title = $c->req->param('title');
    my $description = $c->req->param('description');
    my $due = $c->req->param('due');
    my $list_id = $c->req->param('list_id');
    my @assign_ids = $c->req->param('assign_ids[]');
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    my $task_id = ++$doc->{last_task_id};
    $doc->{tasks} = [] unless $doc->{tasks};
    my $task = {
        id => $task_id,
        requester_id => $requester_id,
        registrant_id => $registrant_id,
        title => $title,
        description => $description,
        due => $due,
        status => 0,
        closed => 0,
        comments => [],
        history => [],
        created => time,
        updated => time,
        sort => $task_id
    };
    $task->{assign_ids} = \@assign_ids;
    push @{$doc->{tasks}}, $task;
    $c->save_list_doc($account, $doc);
    infof("[%s] task create", $c->session->get('screen_name'));
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
            my @keys = qw(status closed title description due requester_id);
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
            if ($c->req->param('assign_ids[]')) {
                my @assign_ids = $c->req->param('assign_ids[]');
                $task->{assign_ids} = \@assign_ids;
            } elsif (defined $c->req->param('assign_ids')) {
                $task->{assign_ids} = [];
            }
            $task->{updated} = time;
            push @{$task->{history}}, {
                id      => $registrant_id,
                action  => $action,
                date    => time * 1000
            };
            my $max_history = $c->config->{max_history} || 20;
            if (scalar(@{$task->{history}}) > $max_history) {
                @{$task->{history}} =
                    splice(@{$task->{history}}, scalar(@{$task->{history}}) - $max_history);
            }
            $target_task = $task;
            $success++;
            last;
        }
    }
    
    die 'NotFound' unless $success;
    $c->save_list_doc($account, $doc);
    infof("[%s] task update %s", $c->session->get('screen_name'), $action);
    $c->render_json({
        success => $success,
        task => $target_task
    });
}

sub move {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $src_list_id = $c->req->param('src_list_id');
    my $dst_list_id = $c->req->param('dst_list_id');
    my $task_id = $c->req->param('task_id');
    
    my $target_task;
    my $src_doc = $c->open_list_doc($account, 'member', $src_list_id);
    my $dst_doc = $c->open_list_doc($account, 'member', $dst_list_id);
    @{$src_doc->{tasks}} = grep {
        my $task = $_;
        if ($task->{id} == $task_id) {
            $target_task = $task;
        }
        $task->{id} == $task_id ? 0 : 1;
    } @{$src_doc->{tasks}};
    die 'NotFound' unless $target_task;
    $target_task->{id} = ++$dst_doc->{last_task_id};
    push @{$dst_doc->{tasks}}, $target_task;
    $c->save_list_doc($account, $dst_doc);
    $account = DoubleSpark::Account->new($c);
    $c->save_list_doc($account, $src_doc);
    infof("[%s] task move", $c->session->get('screen_name'));
    $c->render_json({
        success => 1,
        task => $target_task
    });
}

1;
