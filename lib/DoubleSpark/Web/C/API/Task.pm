package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use Log::Minimal;
use Time::HiRes;

sub create {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        name      => [qw/NOT_NULL/, [qw/LENGTH 1 30/]],
        requester  => [qw/NOT_NULL MEMBER/],
        registrant => [qw/NOT_NULL OWNER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return $c->res_403() unless $res;

    my $name       = $c->req->param('name');
    my $requester  = $c->req->param('requester');
    my $registrant = $c->req->param('registrant');
    my @assign     = $c->req->param('assign');
    my $due        = $c->stash->{date_loose};
    my $list       = $c->stash->{list};
    my $task_id    = ++$list->data->{last_task_id};
    my $time       = int(Time::HiRes::time * 1000);
    my $task = {
        id => $list->list_id . ':' . $task_id,
        requester => $requester,
        registrant => $registrant,
        assign => \@assign,
        name => $name,
        due => $due,
        status => 0,
        closed => 0,
        comments => [],
        history => [],
        created_on => $time,
        updated_on => $time,
        sort => $task_id
    };
    push @{ $list->data->{tasks} }, $task;
    $list->update({ data => $list->data, actioned_on => $time });
    infof('[%s] list [%s] create task: %s', $c->sign_name, $list->data->{name}, $name);
    $c->render_json({
        success => 1,
        task => $task
    });
}

sub update {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        name      => [[qw/LENGTH 1 30/]],
        requester  => [qw/MEMBER/],
        registrant => [qw/NOT_NULL OWNER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return $c->res_403() unless $res;

    my $target_task;
    my $task_id = $c->req->param('task_id');
    my $list    = $c->stash->{list};
    my $time    = int(Time::HiRes::time * 1000);
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;

        my @keys = qw(status closed name requester);
        for my $key (@keys) {
            my $val = $c->req->param($key);
            if (defined $val) {
                $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
            }
        }

        if (my $due = $c->stash->{date_loose}) {
            $task->{due} = $due;
        }

        my $action;
        my $registrant = $c->req->param('registrant');
        my $status     = $c->req->param('status');
        my $closed     = $c->req->param('closed');
        my $status_action_map = {
            0 => 'reopen-task',
            1 => 'start-task',
            2 => 'fix-task'
        };
        if (defined $status) {
            $action = $status_action_map->{$status} or die "unknown status $status";
        } elsif (defined $closed) {
            $action = $closed
                    ? 'close-task'
                    : 're' . $status_action_map->{$task->{status}};
        }
        # by form
        if (defined $c->req->param('name')) {
            $task->{assign} = [ $c->req->param('assign') ];
        }
        if ($action) {
            push @{$task->{history}}, {
                code   => $registrant,
                action => $action,
                time   => $time
            };
        }
        $task->{updated_on} = $time;
        $target_task = $task;
        last;
    }

    return $c->res_404() unless $target_task;

    $list->update({ data => $list->data, actioned_on => $time });

    infof('[%s] list [%s] update task: %s',
        $c->sign_name, $list->data->{name}, $target_task->{name});

    $c->render_json({
        success => 1,
        task => $target_task
    });
}

sub move {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        src_list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        dst_list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id     => [qw/NOT_NULL/],
    );
    return $c->res_403() unless $res;

    my $src_list_id = $c->req->param('src_list_id');
    my $dst_list_id = $c->req->param('dst_list_id');
    my $task_id     = $c->req->param('task_id');
    my $src_list    = $c->db->single('list', { list_id => $src_list_id });
    my $dst_list    = $c->db->single('list', { list_id => $dst_list_id });
    my $time        = int(Time::HiRes::time * 1000);

    my $target_task;
    @{ $src_list->data->{tasks} } = grep {
        if ($_->{id} eq $task_id) {
            $target_task = $_;
        }
        $_->{id} eq $task_id ? 0 : 1;
    } @{ $src_list->data->{tasks} };
    return $c->res_404() unless $target_task;

    push @{ $dst_list->data->{tasks} }, $target_task;

    $src_list->update({ data => $src_list->data, actioned_on => $time });
    $dst_list->update({ data => $dst_list->data, actioned_on => $time });

    infof('[%s] list [%s] move task: %s to %s',
        $c->sign_name,
        $src_list->data->{name},
        $target_task->{name},
        $dst_list->data->{name});

    $c->render_json({
        success => 1,
        task => $target_task
    });
}

1;
