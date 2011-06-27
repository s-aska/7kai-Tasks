package DoubleSpark::Web::C::API::Contact;
use strict;
use warnings;

sub get {
    my ($class, $c) = @_;
    
    my $doc = DoubleSpark::Account->new($c);
    
    $c->render_json({
        success => 1,
        doc => $doc
    });
}

sub sync_from_twitter {
    my ($class, $c) = @_;
    
    my $account_id = $c->session->get('account')->{account_id};
    $c->res_403 unless $account_id;
    
    my $user_id = $c->req->param('user_id');
    my $tw = $c->db->single('tw_account', {
        account_id => $account_id,
        user_id    => $user_id
    });
    $c->res_403 unless $tw;
    
    my $key = 'sync_from_twitter_cache-' . $user_id;
    my $nt = $c->twitter;
    my $cache;
    my $cursor = $c->req->param('cursor') || -1;
    if ($cursor == -1) {
        $cache = [];
    } else {
        $cache = $c->session->get($key);
    }
    my $result = $nt->friends({ user_id => $user_id, cursor => $cursor });
    my $friends_count = $result->{'friends_count'} || 0;
    if ($cursor == -1) {
#        push @{ $result->{users} }, $res;
    }
    my $next_cursor = $result->{'next_cursor'};
    for my $friend ( @{ $result->{users} } ) {
        push @$cache, {
            screen_name => $friend->{screen_name},
            name => $friend->{name},
            profile_image_url => $friend->{profile_image_url}
        };
    }
    if ($next_cursor) {
        $c->session->set($key, $cache);
    }
    # last
    else {
        my $couchdb = $c;
        my $doc_id = 'account-' . $account_id;
        my $doc = DoubleSpark::Account->new($c);
        $doc->{tw}->{$user_id}->{friends} = $cache;
        $couchdb->save_doc($doc->to_hashref);
        $c->session->remove($key);
    }
    
    $c->render_json({
        success => 1,
        friends => $result->{users},
        friends_count => $friends_count,
        sync_count => scalar(@$cache),
        next_cursor => $next_cursor
    });
}

1;

__END__

