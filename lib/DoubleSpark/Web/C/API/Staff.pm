package DoubleSpark::Web::C::API::Staff;
use strict;
use warnings;

sub stat {
    my ($class, $c) = @_;
    
    my $active_accounts = $c->db->count('account', '*' => {
        authenticated_on => { '>' => \'addtime(now(), \'-7 0:0:0\')' }
    });

    my $tw_accounts = $c->db->count('tw_account', '*');
    my $fb_accounts = $c->db->count('fb_account', '*');
    my $total_lists = $c->db->count('list', '*');
    
    $c->render_json({
        success => 1,
        stat => {
            active_accounts => $active_accounts,
            tw_accounts => $tw_accounts,
            fb_accounts => $fb_accounts,
            total_lists => $total_lists
        }
    });
}

1;
