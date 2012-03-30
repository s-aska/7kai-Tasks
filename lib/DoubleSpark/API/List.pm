package DoubleSpark::API::List;
use strict;
use warnings;
use DoubleSpark::Validator;
use Encode;
use JSON::XS;
use Log::Minimal;
use String::Random qw(random_regex);
use Time::HiRes;

sub create {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        name => [qw/NOT_NULL/, [qw/LENGTH 1 20/]],
        description => [[qw/LENGTH 1 2048/]]
    );
    return unless $res;

    my $name = $req->param('name');
    my $description = $req->param('description');

    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        account_id => $c->sign_id,
        data => {
            name => $name,
            description => $description,
            tasks => []
        },
        actioned_on => int(Time::HiRes::time * 1000),
        created_on => \'now()',
        updated_on => \'now()'
    });
    $txn->commit;
    infof('[%s] create list', $c->sign_name);
    return {
        success => 1,
        list => $list->as_hashref
    };
}

sub update {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        name => [qw/NOT_NULL/, [qw/LENGTH 1 20/]],
        description => [[qw/LENGTH 1 2048/]]
    );
    return unless $res;

    my $list = $c->stash->{list};
    $list->data->{name}        = $req->param('name');
    $list->data->{description} = $req->param('description');
    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });
    infof("[%s] update list", $c->sign_name);
    return {
        success => 1,
        list => $list->as_hashref
    };
}

sub invite {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
    );
    return unless $res;

    my $list = $c->stash->{list};
    my $invite_code = random_regex('[a-zA-Z0-9]{16}');
    $list->update({ invite_code => $invite_code });
    infof('[%s] invite list', $c->sign_name);
    return { success => 1, invite_code => $invite_code };
}

sub disinvite {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
    );
    return unless $res;

    my $list = $c->stash->{list};
    $list->update({ invite_code => undef });
    infof('[%s] disinvite list', $c->sign_name);
    return { success => 1 };
}

sub join {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id     => [qw/NOT_NULL/],
        invite_code => [qw/NOT_NULL/]
    );
    return unless $res;

    my $list_id     = $req->param('list_id');
    my $invite_code = $req->param('invite_code');

    my $list = $c->db->single('list', {
        list_id => , $list_id,
        invite_code => $invite_code
    });
    return unless $list;

    my $assign = $c->db->count('list_account', '*', {
        list_id    => $list->list_id,
        account_id => $c->sign_id
    });
    return { success => 1 } if $assign;

    $c->db->insert('list_account', {
        list_id    => $list->list_id,
        account_id => $c->sign_id
    });
    $list->update({ actioned_on => int(Time::HiRes::time * 1000) });
    infof('[%s] join list', $c->sign_name);
    return { success => 1 };
}

sub leave {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        account_id => [qw/NOT_NULL/]
    );
    return unless $res;

    my $list = $c->stash->{list};
    $c->db->delete('list_account', {
        list_id    => $list->list_id,
        account_id => $req->param('account_id')
    });
    $list->update({ actioned_on => int(Time::HiRes::time * 1000) });
    infof('[%s] leave list', $c->sign_name);
    return { success => 1 };
}

sub public {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_OWNER/],
    );
    return unless $res;

    my $list = $c->stash->{list};
    my $public_code = random_regex('[a-zA-Z0-9]{16}');
    $list->update({ public_code => $public_code });
    infof('[%s] public list', $c->sign_name);
    return { success => 1, public_code => $public_code };
}

sub private {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_OWNER/],
    );
    return unless $res;

    my $list = $c->stash->{list};
    $list->update({ public_code => undef });
    infof('[%s] private list', $c->sign_name);
    return { success => 1 };
}

sub delete {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id => [qw/NOT_NULL LIST_ROLE_OWNER/],
    );
    return unless $res;

    my $list = $c->stash->{list};
    return if $list->data->{original};

    $list->delete;
    infof('[%s] delete list', $c->sign_name);
    return { success => 1 };
}

sub clear {
    my ($class, $c, $req) = @_;

    my $res = DoubleSpark::Validator->validate($c, $req,
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/]
    );
    return unless $res;

    my $list = $c->stash->{list};

    my $task_map = {};
    for my $task (@{ $list->data->{tasks} }) {
        $task_map->{ $task->{id} } = $task;
    }
    my $is_alive = sub {
        my $task = shift;
        return if $task->{closed};
        if ($task->{parent_id}) {
            return unless $task_map->{ $_->{parent_id} };
            return if $task_map->{ $_->{parent_id} }->{closed};
        }
        return 1;
    };
    @{ $list->data->{tasks} } = grep { $is_alive->($_) } @{ $list->data->{tasks} };

    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });

    infof('[%s] clear list', $c->sign_name);

    return {
        success => 1,
        list => $list->as_hashref
    };
}

1;
