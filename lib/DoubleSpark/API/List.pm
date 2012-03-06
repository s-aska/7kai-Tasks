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
        description => [[qw/LENGTH 1 2048/]],
        owner => [qw/NOT_NULL OWNER/],
        { members => [qw/members/] }, [qw/MEMBERS/],
        users => [qw/NOT_NULL/]
    );
    return unless $res;

    my $name = $req->param('name');
    my $description = $req->param('description');
    my $owner = $req->param('owner');
    my @members = $req->param('members');
    my $users = decode_json(encode_utf8($req->param('users')));

    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        code => $owner,
        data => {
            name => $name,
            description => $description,
            owner => $owner,
            members => \@members,
            users => $users,
            tasks => []
        },
        actioned_on => int(Time::HiRes::time * 1000),
        created_on => \'now()',
        updated_on => \'now()'
    });
    for my $member (@members) {
        $c->db->insert('list_member', {
            list_id => $list->list_id,
            code => $member,
            created_on => \'now()'
        });
    }
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
        description => [[qw/LENGTH 1 2048/]],
        { members => [qw/members/] }, [qw/MEMBERS/],
        users => [qw/NOT_NULL/],
    );
    return unless $res;

    my $list = $c->stash->{list};

    $list->data->{name}        = $req->param('name');
    $list->data->{description} = $req->param('description');
    $list->data->{members}     = [ $req->param('members') ];
    $list->data->{users}       = decode_json(encode_utf8($req->param('users')));

    # update database
    my $txn = $c->db->txn_scope;
    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });
    my $members = {};
    for my $member (@{ $list->data->{members} }) {
        $members->{ $member }++;
    }
    my $list_member = $c->db->search('list_member', {
        list_id => $list->list_id
    });
    for my $member ($list_member->all) {
        unless (delete $members->{ $member->code }) {
            debugf('[%s] unassign member %s from list %s',
                $c->sign_name,
                $member->code,
                $list->data->{name});
            $member->delete;
        }
    }
    for my $code (keys %$members) {
        debugf('[%s] assign member %s from list %s',
            $c->sign_name,
            $code,
            $list->data->{name});
        $c->db->insert('list_member', {
            list_id => $list->list_id,
            code => $code,
            created_on => \'now()'
        });
    }
    $txn->commit;

    infof("[%s] update list", $c->sign_name);

    return {
        success => 1,
        list => $list->as_hashref
    };
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
