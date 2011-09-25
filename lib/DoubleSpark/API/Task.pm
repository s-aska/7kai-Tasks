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
        name      => [qw/NOT_NULL/, [qw/LENGTH 1 50/]],
        requester  => [qw/NOT_NULL MEMBER/],
        registrant => [qw/NOT_NULL OWNER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return unless $res;

    my $name       = $req->param('name');
    my $requester  = $req->param('requester');
    my $registrant = $req->param('registrant');
    my @assign     = $req->param('assign');
    my $due        = $c->stash->{date_loose};
    my $list       = $c->stash->{list};
    my $time       = int(Time::HiRes::time * 1000);
    my $task_id    = $req->param('task_id') ||
                         $list->list_id . ':' . ++$list->data->{last_task_id};
    my $task = {
        id => $task_id,
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
        name      => [[qw/LENGTH 1 50/]],
        requester  => [qw/MEMBER/],
        registrant => [qw/NOT_NULL OWNER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return unless $res;

    my $target_task;
    my $task_id      = $req->param('task_id');
    my $requested_on = $req->param('requested_on');
    my $list         = $c->stash->{list};
    my $time         = int(Time::HiRes::time * 1000);
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;

        my @keys = qw(status closed name requester);
        for my $key (@keys) {
            my $val = $req->param($key);
            if (defined $val) {
                $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
            }
        }

        my $action;
        my $registrant = $req->param('registrant');
        my $status     = $req->param('status');
        my $closed     = $req->param('closed');
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

        if (my $due = $c->stash->{date_loose}) {
            $task->{due} = $due;
        }

        # by form
        if (defined $req->param('name')) {
            $task->{assign} = [ $req->param('assign') ];
             unless ($c->stash->{date_loose}) {
                $task->{due} = '';
            }
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

    my $target_task;
    @{ $src_list->data->{tasks} } = grep {
        if ($_->{id} eq $task_id) {
            $target_task = $_;
        }
        $_->{id} eq $task_id ? 0 : 1;
    } @{ $src_list->data->{tasks} };
    return unless $target_task;

    push @{ $dst_list->data->{tasks} }, $target_task;

    $src_list->update({ data => $src_list->data, actioned_on => $time });
    $dst_list->update({ data => $dst_list->data, actioned_on => $time });

    infof('[%s] move task', $c->sign_name);

    return {
        success => 1,
        task => $target_task
    };
}

1;
