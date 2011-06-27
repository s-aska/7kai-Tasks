package DoubleSpark::Web::C::API::List;
use strict;
use warnings;
use DoubleSpark::Account;

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
    my $owner = $c->req->param('owner');
    my @members = $c->req->param('members[]');
    my $privacy = lc($c->req->param('privacy')) || 'closed';
    
    return $c->res_403 if ! length $name;
    return $c->res_403 if $privacy!~/^(open|closed|secret)$/;
    
    my $txn = $c->db->txn_scope;
    my $list = $c->db->insert('list', {
        account_id => $account->{account_id},
        created_on => \'now()'
    });
    for my $code (@members) {
        $c->db->insert('list_member', {
            list_id => $list->list_id,
            code => $code,
            created_on => \'now()'
        });
    }
    my $doc_id = 'list-' . $list->list_id;
    $c->save_doc({
        _id => $doc_id,
        name => $name,
        privacy => $privacy,
        owner   => $owner,
        members => \@members,
        tasks => [],
        history => [
            {
                code   => $owner,
                action => 'create-list',
                date   => time
            }
        ]
    });
    $txn->commit;
    
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
    my $owner = $c->req->param('owner');
    my @members = $c->req->param('members[]');
    # my $privacy = lc($c->req->param('privacy')) || 'closed';
    
    return $c->res_403 if ! length $name;
    
    my $doc_id = $list_id;
    my $doc = $c->open_list_doc($account, 'admin', $list_id);
    $doc->{name} = $name;
    $doc->{owner} = $owner;
    $doc->{members} = \@members;
    push @{$doc->{history}}, {
        code   => $owner,
        action => 'update-list',
        date   => time
    };
    $c->save_doc($doc);
    
    my $members = {};
    for my $member (@members) {
        $members->{$member}++;
    }
    my ($id) = $list_id=~/(\d+)/;
    my $list_member = $c->db->search('list_member', {
        list_id => $id
    });
    for my $member ($list_member->all) {
        my $code = $member->code;
        if (delete $members->{$code}) {
            
        } else {
            $member->delete;
        }
    }
    for my $code (keys %$members) {
        $c->db->insert('list_member', {
            list_id => $id,
            code => $code,
            created_on => \'now()'
        });
    }
    
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
    my $txn = $c->db->txn_scope;
    my $list = $c->db->delete('list', {
        account_id => $account->{account_id},
        list_id => $id
    });
    my $doc = $c->open_list_doc($account, 'admin', $list_id);
    $c->remove_doc($doc);
    $txn->commit;
    
    $c->render_json({
        success => 1,
        list_id => $list_id
    });
}

sub clear {
    my ($class, $c) = @_;
    
    my $account = DoubleSpark::Account->new($c);
    my $owner = $c->req->param('owner');
    my $list_id = $c->req->param('list_id');
    
    # FXIME: role check
    my $success;
    my $target_task;
    my $doc = $c->open_list_doc($account, 'member', $list_id);
    my $num = scalar(@{$doc->{tasks}});
    @{$doc->{tasks}} = grep { !$_->{closed} } @{$doc->{tasks}};
    my $count = $num - scalar(@{$doc->{tasks}});
    push @{$doc->{history}}, {
        code    => $owner,
        action  => 'clear-task',
        date    => time
    };
    $c->splice_history($doc);
    $c->save_doc($doc);
    $c->render_json({
        success => $count ? 1 : 0,
        count => $count
    });
}

1;

__END__

