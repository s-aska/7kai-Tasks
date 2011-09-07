package DoubleSpark::Web::C::API::List;
use strict;
use warnings;
use Log::Minimal;

sub retrieve {
    my ($class, $c) = @_;

    my $account = $c->account;
    my $list_id = $c->{args}->{list_id};
    my $docs = $c->open_list_docs($account, 'member', [$list_id]);
    $c->render_json({
        success => 1,
        list => $docs->[0]
    });
}

sub create {
    my ($class, $c) = @_;

    my $res = $c->validate(
        name => [qw/NOT_NULL/, [qw/LENGTH 1 20/]],
        owner => [qw/NOT_NULL OWNER/],
        { members => [qw/members/] }, [qw/MEMBERS/],
    );
    return $c->res_403() unless $res;

    my $name = $c->req->param('name');
    my $owner = $c->req->param('owner');
    my @members = $c->req->param('members');

    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        code => $owner,
        data => {
            name => $name,
            owner => $owner,
            members => \@members,
            tasks => []
        },
        created_on => \'now()'
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
    );
    return $c->res_403() unless $res;

    my $list = $c->stash->{list};

    my $args = { data => $list->data };
    $list->data->{name}    = $c->req->param('name');
    $list->data->{members} = [ $c->req->param('members') ];

    # update database
    my $txn = $c->db->txn_scope;
    $list->update($args);
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
    my $name = $list->data->{name};
    $list->delete;
    infof("[%s] delete list %s", $c->sign_name, $name);
    $c->render_json({ success => 1 });
}

sub clear {
    my ($class, $c) = @_;

    my $account = $c->account;
    my $owner_id = $c->req->param('owner_id');
    my $list_id = $c->req->param('list_id');

    # FXIME: role check
    my $success;
    my $target_task;
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    return $doc unless (ref $doc) eq 'HASH';
    my $num = scalar(@{$doc->{tasks}});
    @{$doc->{tasks}} = grep { !$_->{closed} } @{$doc->{tasks}};
    my $count = $num - scalar(@{$doc->{tasks}});
    $c->save_list_doc($account, $doc);
    infof("[%s] list clear", $c->session->get('screen_name'));
    $c->render_json({
        success => $count ? 1 : 0,
        count => $count
    });
}

1;

__END__

