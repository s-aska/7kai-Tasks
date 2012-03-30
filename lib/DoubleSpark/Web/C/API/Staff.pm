package DoubleSpark::Web::C::API::Staff;
use strict;
use warnings;

sub stat {
    my ($class, $c) = @_;

    my $weekly_active_accounts = $c->db->count('account', '*' => {
        authenticated_on => { '>' => \'addtime(now(), \'-7 0:0:0\')' }
    });
    my $monthly_active_accounts = $c->db->count('account', '*' => {
        authenticated_on => { '>' => \'addtime(now(), \'-30 0:0:0\')' }
    });

    my $tw_accounts = $c->db->count('tw_account', '*');
    my $fb_accounts = $c->db->count('fb_account', '*');
    my $google_accounts = $c->db->count('google_account', '*');
    my $total_lists = $c->db->count('list', '*');

    $c->render_json({
        success => 1,
        stat => {
            weekly_active_accounts => $weekly_active_accounts,
            monthly_active_accounts => $monthly_active_accounts,
            tw_accounts => $tw_accounts,
            fb_accounts => $fb_accounts,
            google_accounts => $google_accounts,
            total_lists => $total_lists
        }
    });
}

1;
