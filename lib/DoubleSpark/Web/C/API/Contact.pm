package DoubleSpark::Web::C::API::Contact;
use strict;
use warnings;
use Log::Minimal;

sub lookup_twitter {
    my ($class, $c) = @_;
    
    my $account_id = $c->session->get('account')->{account_id};
    $c->res_403 unless $account_id;
    
    my @user_ids = $c->req->param('user_ids[]');
    for (@user_ids) {
        $_=~s|^tw-||g;
    }
    my $nt = $c->twitter;
    my $res;
    eval {
        $res = $nt->lookup_users({ user_id => \@user_ids });
    }; if($@) {
        warnf('twitter lookup_users error: %s', $@);
        return $c->render_json({
            success => 0
        });
    }
    $c->render_json({
        success => 1,
        friends => $res
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
    my @friends;
    for my $friend_ ( @{ $result->{users} } ) {
        my $friend = {
            user_id => $friend_->{id},
            screen_name => $friend_->{screen_name},
            name => $friend_->{name},
            profile_image_url => $friend_->{profile_image_url}
        };
        push @$cache, $friend;
        push @friends, $friend;
    }
    if ($next_cursor) {
        $c->session->set($key, $cache);
    }
    # last
    else {
        my $couchdb = $c;
        my $doc_id = 'account-' . $account_id;
        my $doc = DoubleSpark::Account->new($c);
        my $res = $nt->show_user($user_id);
        push @$cache, {
            user_id => $user_id,
            screen_name => $res->{screen_name},
            name => $res->{name},
            profile_image_url => $res->{profile_image_url}
        };
        $doc->{tw}->{$user_id}->{friends} = $cache;
        $doc->{tw}->{$user_id}->{name} = $res->{name};
        $doc->{tw}->{$user_id}->{screen_name} = $res->{screen_name};
        $doc->{tw}->{$user_id}->{profile_image_url} = $res->{profile_image_url};
        $couchdb->save_doc($doc->to_hashref);
        $c->session->remove($key);
    }
    
    $c->render_json({
        success => 1,
        friends => \@friends,
        friends_count => $friends_count,
        sync_count => scalar(@$cache),
        next_cursor => $next_cursor
    });
}

1;

__END__

