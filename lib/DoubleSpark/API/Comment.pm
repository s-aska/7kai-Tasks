package DoubleSpark::API::Comment;
use strict;
use warnings;
use DoubleSpark::Validator;
use Log::Minimal;
use Time::HiRes;

sub create {
    my ($class, $c, $req) = @_;

    # status closed message
    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        message    => ['NOT_NULL', [qw/LENGTH 1 240/]],
        registrant => [qw/NOT_NULL OWNER/]
    );
    return unless $res;

    my $target_task;
    my $list       = $c->stash->{list};
    my $task_id    = $req->param('task_id');
    my $message    = $req->param('message');
    my $registrant = $req->param('registrant');
    my $time       = int(Time::HiRes::time * 1000);
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;

        my $action = 'comment';
        my @keys = qw(status closed);
        for my $key (@keys) {
            my $val = $req->param($key);
            if (defined $val && length $val) {
                $task->{$key} = $val=~/^\d+$/ ? int($val) : $val;
                $action = +{
                    status => {
                        0 => 'reopen-task',
                        1 => 'start-task',
                        2 => 'fix-task'
                    },
                    closed => { 1 => 'close-task' }
                }->{ $key }->{ $val };
            }
        }

        # create comment
        my $comment_id = ++$task->{last_comment_id};
        push @{ $task->{actions} }, {
            id      => $comment_id,
            code    => $registrant,
            message => $message,
            time    => $time,
            action  => $action
        };
        $task->{updated_on} = $time;

        $target_task = $task;
        last;
    }

    return unless $target_task;

    $list->update({ data => $list->data, actioned_on => $time });

    infof('[%s] comment task', $c->sign_name);

    return {
        success => 1,
        task => $target_task
    };
}

sub delete {
    my ($class, $c, $req) = @_;

    # status closed message
    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        comment_id => [qw/NOT_NULL/],
    );
    return unless $res;

    my $account    = $c->account;
    my $list       = $c->stash->{list};
    my $list_id    = $req->param('list_id');
    my $task_id    = $req->param('task_id');
    my $comment_id = $req->param('comment_id');

    my $target_task;
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;
        @{$task->{actions}} = grep {
            $_->{id} ne $comment_id
        } @{$task->{actions}};
        $target_task = $task;
        last;
    }

    return unless $target_task;

    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });

    infof('[%s] comment delete', $c->sign_name);

    return {
        success => 1,
        task => $target_task,
    };
}

1;
