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

    my $name      = $c->req->param('name');
    my $requester  = $c->req->param('requester');
    my $registrant = $c->req->param('registrant');
    my @assign     = $c->req->param('assign');
    my $due        = $c->stash->{date_loose};
    my $list       = $c->stash->{list};
    my $task_id    = ++$list->data->{last_task_id};
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
        created => int(Time::HiRes::time * 1000),
        updated => int(Time::HiRes::time * 1000),
        sort => $task_id
    };
    push @{ $list->data->{tasks} }, $task;
    # warn Dumper($list->data); use Data::Dumper;
    $list->update({ data => $list->data });
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
        $task->{updated} = int(Time::HiRes::time * 1000);
        if ($action) {
            push @{$task->{history}}, {
                code    => $registrant,
                action  => $action,
                date    => int(Time::HiRes::time * 1000)
            };
        }
        $target_task = $task;
        last;
    }

    return $c->res_404() unless $target_task;

    $list->update({ data => $list->data });

    infof('[%s] list [%s] update task: %s',
        $c->sign_name, $list->data->{name}, $target_task->{name});

    $c->render_json({
        success => 1,
        task => $target_task
    });
}
# 
# sub move {
#     my ($class, $c) = @_;
#     
#     my $account = $c->account;
#     my $src_list_id = $c->req->param('src_list_id');
#     my $dst_list_id = $c->req->param('dst_list_id');
#     my $task_id = $c->req->param('task_id');
#     
#     my $target_task;
#     my $src_doc = $c->open_list_doc($account, 'member', $src_list_id);
#     my $dst_doc = $c->open_list_doc($account, 'member', $dst_list_id);
#     return $src_doc unless (ref $src_doc) eq 'HASH';
#     return $dst_doc unless (ref $dst_doc) eq 'HASH';
#     @{$src_doc->{tasks}} = grep {
#         my $task = $_;
#         if ($task->{id} == $task_id) {
#             $target_task = $task;
#         }
#         $task->{id} == $task_id ? 0 : 1;
#     } @{$src_doc->{tasks}};
#     return $c->res_404() unless $target_task;
#     $target_task->{id} = ++$dst_doc->{last_task_id};
#     push @{$dst_doc->{tasks}}, $target_task;
#     $c->save_list_doc($account, $dst_doc);
#     $account = DoubleSpark::Account->new($c);
#     $c->save_list_doc($account, $src_doc);
#     infof("[%s] task move", $c->session->get('screen_name'));
#     $c->render_json({
#         success => 1,
#         task => $target_task
#     });
# }

1;
