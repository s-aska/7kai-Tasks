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
    my $time       = int(Time::HiRes::time * 1000);
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
        my $comment_id = ++$task->{last_comment_id};
        push @{ $task->{comments} }, {
            id      => $comment_id,
            code    => $registrant,
            message => $message,
            time    => $time
        };
        $task->{updated_on} = $time;

        $target_task = $task;
        last;
    }

    return $c->res_404() unless $target_task;

    $list->update({ data => $list->data, actioned_on => $time });

    infof('[%s] list [%s] comment task: %s',
        $c->sign_name, $list->data->{name}, $target_task->{name});

    $c->render_json({
        success => 1,
        task => $target_task
    });
}

sub delete {
    my ($class, $c) = @_;

    # status closed message
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        task_id    => [qw/NOT_NULL/],
        comment_id => [qw/NOT_NULL/],
    );
    return $c->res_403() unless $res;

    my $account    = $c->account;
    my $list       = $c->stash->{list};
    my $list_id    = $c->req->param('list_id');
    my $task_id    = $c->req->param('task_id');
    my $comment_id = $c->req->param('comment_id');

    my $target_task;
    for my $task (@{ $list->data->{tasks} }) {
        next if $task->{id} ne $task_id;
        @{$task->{comments}} = grep {
            $_->{id} ne $comment_id
        } @{$task->{comments}};
        $target_task = $task;
        last;
    }

    return $c->res_404() unless $target_task;

    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });

    infof('[%s] list [%s] comment delete',
        $c->sign_name, $list->data->{name});

    $c->render_json({
        success => 1,
        task => $target_task,
    });
}

1;
