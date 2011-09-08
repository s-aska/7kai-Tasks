package DoubleSpark::Web::C::API::Comment;
use strict;
use warnings;
use Log::Minimal;
use Time::HiRes;

sub create {
    my ($class, $c) = @_;

    # status closed message
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        message    => [[qw/LENGTH 1 240/]],
        registrant => [qw/NOT_NULL OWNER/]
    );
    return $c->res_403() unless $res;

    my $target_task;
    my $list       = $c->stash->{list};
    my $task_id    = $c->req->param('task_id');
    my $message    = $c->req->param('message');
    my $registrant = $c->req->param('registrant');
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;

        my @keys = qw(status closed);
        for my $key (@keys) {
            my $val = $c->req->param($key);
            if (defined $val) {
                $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
            }
        }

        # create comment
        my $time = int(Time::HiRes::time * 1000);
        my $comment_id = ++$task->{last_comment_id};
        push @{ $task->{comments} }, {
            id      => $comment_id,
            code    => $registrant,
            message => $message,
            date    => $time
        };
        $task->{updated} = $time;

        # FIXME: このコピペをなんとかしたい
        my $action;
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
            $action = $closed
                    ? 'close-task'
                    : 're' . $status_action_map->{$task->{status}};
        }
        if ($action) {
            push @{$task->{history}}, {
                code   => $registrant,
                action => $action,
                date   => $time + 1
            };
        }
        $target_task = $task;
        last;
    }

    return $c->res_404() unless $target_task;

    $list->update({ data => $list->data });

    infof('[%s] list [%s] comment task: %s',
        $c->sign_name, $list->data->{name}, $target_task->{name});

    $c->render_json({
        success => 1,
        task => $target_task
    });
}

sub delete {
    my ($class, $c) = @_;
    
    my $account = $c->account;
    my $owner_id = $c->req->param('owner_id');
    my $list_id = $c->req->param('list_id');
    my $task_id = $c->req->param('task_id');
    my $comment_id = $c->req->param('comment_id');
    
    # FXIME: role check
    my $success;
    my $target_task;
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    return $doc unless (ref $doc) eq 'HASH';
    for my $task (@{$doc->{tasks}}) {
        if ($task->{id} == $task_id) {
            last unless $task->{comments};
            @{$task->{comments}} = grep {
                $_->{id} ne $comment_id
            } @{$task->{comments}};
            $success++;
            $target_task = $task;
            last;
        }
    }
    $c->save_list_doc($account, $doc);
    infof("[%s] comment delete", $c->session->get('screen_name'));
    $c->render_json({
        success => $success,
        task => $target_task,
    });
}

1;

__END__

