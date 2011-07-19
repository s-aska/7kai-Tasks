package DoubleSpark::Web::C::API::List;
use strict;
use warnings;
use DoubleSpark::Account;
use Log::Minimal;

sub get {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $list_id = $c->{args}->{list_id};
    my $docs = $c->open_list_docs($account, 'member', [$list_id]);
    $c->render_json({
        success => 1,
        list => $docs->[0]
    });
}

sub create {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $name = $c->req->param('name');
    my $owner_id = $c->req->param('owner_id');
    my @member_ids = $c->req->param('member_ids[]');
    my $privacy = $c->req->param('privacy') || 'closed';
    
    return $c->res_403 if ! length $name;
    return $c->res_403 if $privacy!~/^(open|closed|secret)$/;
    
    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        owner => $owner_id,
        created_on => \'now()'
    });
    for my $member_id (@member_ids) {
        $c->db->insert('list_member', {
            list_id => $list->list_id,
            member => $member_id,
            created_on => \'now()'
        });
    }
    my $doc_id = 'list-' . $list->list_id;
    $c->save_doc({
        _id => $doc_id,
        name => $name,
        privacy => $privacy,
        owner_id => $owner_id,
        member_ids => \@member_ids,
        tasks => []
    });
    $txn->commit;
    infof("[%s] list create", $c->session->get('screen_name'));
    $c->render_json({
        success => 1,
        list_id => $doc_id
    });
}

sub update {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $list_id = $c->req->param('list_id');
    my $name = $c->req->param('name');
    my $owner_id = $c->req->param('owner_id');
    my @member_ids = $c->req->param('member_ids[]');
    
    return $c->res_403 if ! length $name;
    
    my $doc_id = $list_id;
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    $doc->{name} = $name;
    if ($account->has_role_owner($doc) && $owner_id) {
        $doc->{owner_id} = $owner_id;
    }
    $doc->{member_ids} = \@member_ids;
    $c->save_list_doc($account, $doc);
    
    my $members = {};
    for my $member (@member_ids) {
        $members->{$member}++;
    }
    my ($id) = $list_id=~/(\d+)/;
    my $list_member = $c->db->search('list_member', {
        list_id => $id
    });
    for my $member ($list_member->all) {
        my $id = $member->member;
        if (delete $members->{$id}) {
            
        } else {
            $member->delete;
        }
    }
    for my $member_id (keys %$members) {
        $c->db->insert('list_member', {
            list_id => $id,
            member => $member_id,
            created_on => \'now()'
        });
    }
    infof("[%s] list update", $c->session->get('screen_name'));
    $c->render_json({
        success => 1,
        list_id => $list_id
    });
}

sub delete {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $list_id = $c->req->param('list_id');
    
    $c->res_403 if $list_id!~/^list-\d+/;
    
    my ($id) = $list_id=~/(\d+)/;
    my $doc = $c->open_list_doc($account, 'owner', $list_id);
    my $txn = $c->db->txn_scope;
    $c->db->delete('list', {
        list_id => $id
    });
    $c->remove_doc($doc);
    $txn->commit;
    infof("[%s] list delete", $c->session->get('screen_name'));
    $c->render_json({
        success => 1,
        list_id => $list_id
    });
}

sub clear {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $owner_id = $c->req->param('owner_id');
    my $list_id = $c->req->param('list_id');
    
    # FXIME: role check
    my $success;
    my $target_task;
    my $doc = $c->open_list_doc($account, 'member', $list_id);
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

