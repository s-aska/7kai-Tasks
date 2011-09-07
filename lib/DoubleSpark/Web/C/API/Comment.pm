package DoubleSpark::Web::C::API::Comment;
use strict;
use warnings;
use Log::Minimal;

sub create {
    my ($class, $c) = @_;
    
    my $account = $c->account;
    my $account_id = $account->{account_id};
    my $owner_id = $c->req->param('owner_id');
    my $list_id = $c->req->param('list_id');
    my $task_id = $c->req->param('task_id');
    my $comment = $c->req->param('comment');
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    return $doc unless (ref $doc) eq 'HASH';
    my $success;
    my $target_task;
    my $comment_id;
    for my $task (@{$doc->{tasks}}) {
        if ($task->{id} == $task_id) {
            $task->{updated} = time;
            $comment_id = ++$task->{last_comment_id};
            my $comment = {
                id         => $comment_id,
                owner_id   => $owner_id,
                comment    => $comment,
                time       => time * 1000
            };
            $task->{comments} ||= [];
            push @{$task->{comments}}, $comment;
            $target_task = $task;
            $success++;
            last;
        }
    }
    $c->save_list_doc($account, $doc);
    infof("[%s] comment", $c->session->get('screen_name'));
    $c->render_json({
        success => 1,
        task => $target_task,
        comment_id => $comment_id
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

