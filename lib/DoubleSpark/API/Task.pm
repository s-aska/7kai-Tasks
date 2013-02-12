package DoubleSpark::API::Task;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Time::HiRes;

sub create {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        name       => [qw/NOT_NULL/, [qw/LENGTH 1 50/]],
        requester  => [qw/MEMBER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return unless $res;

    my $name       = $req->param('name');
    my $requester  = $req->param('requester') || $c->sign_id;
    my @assign     = $req->param('assign');
    my $due        = $c->stash->{date_loose};
    my $duration   = int($req->param('duration') || 0);
    my $list       = $c->stash->{list};
    my $time       = int(Time::HiRes::time * 1000);
    my $task_id    = $req->param('task_id') ||
                         $list->list_id . ':' . ++$list->data->{last_task_id};
    my $parent_id  = $req->param('parent_id');
    for (@{ $list->data->{tasks} }) {
        if ($_->{id} eq $task_id) {
            infof('[%s] duplicate task', $c->sign_name);
            return;
        }
    }
    my $task = {
        id => $task_id,
        parent_id => $parent_id,
        requester => $requester,
        registrant => $c->sign_id,
        assign => \@assign,
        name => $name,
        due => $due,
        duration => $duration,
        status => 0,
        closed => 0,
        pending => 0,
        actions => [],
        created_on => $time,
        updated_on => $time
    };
    push @{ $list->data->{tasks} }, $task;
    $list->update({ data => $list->data, actioned_on => $time });
    infof('[%s] create task', $c->sign_name);
    return {
        success => 1,
        task => $task
    };
}

sub update {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        name       => [[qw/LENGTH 1 50/]],
        requester  => [qw/MEMBER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return unless $res;

    my $target_task;
    my $task_id      = $req->param('task_id');
    my $list         = $c->stash->{list};
    my $time         = int(Time::HiRes::time * 1000);
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;

        my @keys = qw(status closed pending name requester parent_id duration);
        for my $key (@keys) {
            my $val = $req->param($key);
            if (defined $val) {
                next if $key eq 'parent_id' && $val eq $task->{id};
                $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
            }
        }

        my $action;
        my $status = $req->param('status');
        my $closed = $req->param('closed');
        my $status_action_map = {
            0 => 'reopen-task',
            1 => 'start-task',
            2 => 'fix-task'
        };
        if (defined $status && length $status) {
            $action = $status_action_map->{$status} or die "unknown status $status";
        } elsif (defined $closed && length $closed) {
            $action = $closed
                    ? 'close-task'
                    : 're' . $status_action_map->{$task->{status}};
        }

        if (my $due = $c->stash->{date_loose}) {
            $task->{due} = $due;
        }

        # by form
        if (defined $req->param('name')) {
            $task->{assign} = [ $req->param('assign') ];
        }
        if (defined $req->param('due') && !$c->stash->{date_loose}) {
            $task->{due} = '';
        }

        if ($action) {
            push @{$task->{actions}}, {
                account_id => $c->sign_id,
                action     => $action,
                time       => $time
            };
            $task->{updated_on} = $time;
        }
        $target_task = $task;
        last;
    }

    return unless $target_task;

    $list->update({ data => $list->data, actioned_on => $time });

    infof('[%s] update task', $c->sign_name);

    return {
        success => 1,
        task => $target_task
    };
}

sub move {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        src_list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        dst_list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id     => [qw/NOT_NULL/],
    );
    return unless $res;

    my $src_list_id = $req->param('src_list_id');
    my $dst_list_id = $req->param('dst_list_id');
    my $task_id     = $req->param('task_id');
    my $src_list    = $c->db->single('list', { list_id => $src_list_id });
    my $dst_list    = $c->db->single('list', { list_id => $dst_list_id });
    my $time        = int(Time::HiRes::time * 1000);

    my $task_map = {};
    my $parent_map = {};
    for my $task (@{ $src_list->data->{tasks} }) {
        $task_map->{ $task->{id} } = $task;
    }
    my $is_parent;
    $is_parent = sub {
        my ($task, $parent_id) = @_;
        return unless $task->{parent_id};
        return 1 if $task->{parent_id} eq $parent_id;
        return $is_parent->($task_map->{ $task->{parent_id} }, $parent_id);
    };

    my @target_tasks;
    @{ $src_list->data->{tasks} } = grep {
        my $is_target;
        if ($_->{id} eq $task_id) {
            $_->{parent_id} = '';
            push @target_tasks, $_;
            $is_target++;
        } elsif ($is_parent->($_, $task_id)) {
            push @target_tasks, $_;
            $is_target++;
        }
        not $is_target;
    } @{ $src_list->data->{tasks} };
    return unless @target_tasks;

    push @{ $dst_list->data->{tasks} }, @target_tasks;

    $src_list->update({ data => $src_list->data, actioned_on => $time });
    $dst_list->update({ data => $dst_list->data, actioned_on => $time });

    infof('[%s] move task', $c->sign_name);

    return {
        success => 1,
        tasks => \@target_tasks
    };
}

1;
