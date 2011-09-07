package DoubleSpark::Web::C::API::Task;
use strict;
use warnings;
use Log::Minimal;

sub create {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        title      => [qw/NOT_NULL/, [qw/LENGTH 1 30/]],
        requester  => [qw/NOT_NULL MEMBER/],
        registrant => [qw/NOT_NULL OWNER/],
        due        => [qw/DATE_LOOSE/],
        { assign => [qw/assign/] }, [qw/MEMBERS/],
    );
    return $res if $res;

    my $title      = $c->req->param('title');
    my $requester  = $c->req->param('requester');
    my $registrant = $c->req->param('registrant');
    my @assign     = $c->req->param('assign');
    my $due        = $c->stash->{date_loose};
    my $list       = $c->stash->{list};
    my $task_id    = ++$list->data->{last_task_id};
    my $task = {
        id => $task_id,
        requester => $requester,
        registrant => $registrant,
        title => $title,
        due => $due,
        status => 0,
        closed => 0,
        comments => [],
        history => [],
        created => time,
        updated => time,
        sort => $task_id
    };
    push @{ $list->data->{tasks} }, $task;
    warn Dumper($list->data); use Data::Dumper;
#    $list->update({ data => $list->data });
    infof('[%s] list [%s] create task: %s', $c->sign_name, $list->data->{name}, $title);
    $c->render_json({
        success => 1,
        task => $task
    });
}

# sub update {
#     my ($class, $c) = @_;
#     
#     my $account = $c->account;
#     my $registrant_id = $c->req->param('registrant_id');
#     my $list_id = $c->req->param('list_id');
#     my $task_id = $c->req->param('task_id');
#     
#     my $success;
#     my $target_task;
#     my $action = 'update-task';
#     my $doc = $c->open_list_doc($account, 'member', $list_id);
#     return $doc unless (ref $doc) eq 'HASH';
#     for my $task (@{$doc->{tasks}}) {
#         if ($task->{id} == $task_id) {
#             my @keys = qw(status closed title description due requester_id);
#             for my $key (@keys) {
#                 my $val = $c->req->param($key);
#                 if (defined $val) {
#                     $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
#                 }
#             }
#             my $status = $c->req->param('status');
#             my $closed = $c->req->param('closed');
#             my $status_action_map = {
#                 0 => 'reopen-task',
#                 1 => 'start-task',
#                 2 => 'fix-task'
#             };
#             if (defined $status) {
#                 $action = $status_action_map->{$status};
#             } elsif (defined $closed) {
#                 $action = $closed ? 'close-task' : 're' . $status_action_map->{$task->{status}};
#             }
#             if ($c->req->param('assign_ids[]')) {
#                 my @assign_ids = $c->req->param('assign_ids[]');
#                 $task->{assign_ids} = \@assign_ids;
#             } elsif (defined $c->req->param('assign_ids')) {
#                 $task->{assign_ids} = [];
#             }
#             $task->{updated} = time;
#             push @{$task->{history}}, {
#                 id      => $registrant_id,
#                 action  => $action,
#                 date    => time * 1000
#             };
#             my $max_history = $c->config->{max_history} || 20;
#             if (scalar(@{$task->{history}}) > $max_history) {
#                 @{$task->{history}} =
#                     splice(@{$task->{history}}, scalar(@{$task->{history}}) - $max_history);
#             }
#             $target_task = $task;
#             $success++;
#             last;
#         }
#     }
#     
#     return $c->res_404() unless $success;
#     $c->save_list_doc($account, $doc);
#     infof("[%s] task update %s", $c->session->get('screen_name'), $action);
#     $c->render_json({
#         success => $success,
#         task => $target_task
#     });
# }
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
