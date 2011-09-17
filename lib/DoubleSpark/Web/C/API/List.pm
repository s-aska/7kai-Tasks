package DoubleSpark::Web::C::API::List;
use strict;
use warnings;
use Encode;
use Log::Minimal;
use JSON::XS;

sub create {
    my ($class, $c) = @_;

    my $res = $c->validate(
        name => [qw/NOT_NULL/, [qw/LENGTH 1 20/]],
        owner => [qw/NOT_NULL OWNER/],
        { members => [qw/members/] }, [qw/MEMBERS/],
        users => [qw/NOT_NULL/]
    );
    return $c->res_403() unless $res;

    my $name = $c->req->param('name');
    my $owner = $c->req->param('owner');
    my @members = $c->req->param('members');
    my $users = decode_json(encode_utf8($c->req->param('users')));

    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        code => $owner,
        data => {
            name => $name,
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
    infof('[%s] create list: %s', $c->sign_name, $name);
    $c->render_json({
        success => 1,
        list => $list->as_hashref
    });
}

sub update {
    my ($class, $c) = @_;

    my $res = $c->validate(
        list_id => [qw/NOT_NULL LIST_ROLE_MEMBER/],
        name => [qw/NOT_NULL/, [qw/LENGTH 1 20/]],
        { members => [qw/members/] }, [qw/MEMBERS/],
        users => [qw/NOT_NULL/],
    );
    return $c->res_403() unless $res;

    my $list = $c->stash->{list};

    $list->data->{name}    = $c->req->param('name');
    $list->data->{members} = [ $c->req->param('members') ];
    $list->data->{users}   = decode_json(encode_utf8($c->req->param('users')));

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

    infof("[%s] update list %s", $c->sign_name, $list->data->{name});

    $c->render_json({
        success => 1,
        list => $list->as_hashref
    });
}

sub delete {
    my ($class, $c) = @_;

    my $res = $c->validate(
        list_id => [qw/NOT_NULL LIST_ROLE_OWNER/],
    );
    return $c->res_403() unless $res;

    my $list = $c->stash->{list};
    return  $c->res_403() if $list->data->{original};
    
    $list->delete;
    infof("[%s] delete list %s", $c->sign_name);
    $c->render_json({ success => 1 });
}

sub clear {
    my ($class, $c) = @_;
    
    my $res = $c->validate(
        list_id    => [qw/NOT_NULL LIST_ROLE_MEMBER/]
    );
    return $c->res_403() unless $res;

    my $list = $c->stash->{list};

    @{ $list->data->{tasks} } = grep {
        !$_->{closed}
    } @{ $list->data->{tasks} };

    $list->update({ data => $list->data, actioned_on => int(Time::HiRes::time * 1000) });

    infof('[%s] clear list [%s]',
        $c->sign_name, $list->data->{name});

    $c->render_json({
        success => 1,
        list => $list->as_hashref
    });
}

1;
