package DoubleSpark::Web::C::API::Feedback;
use strict;
use warnings;

sub post {
    my ($class, $c) = @_;
    
    my $account = $c->session->get('account');
    my $account_id;
    if ($account) {
        $account_id = $account->{account_id};
    }
    
    my $comment = $c->req->param('comment');
    $c->db->insert('feedback', {
        account_id => $account_id,
        comment    => $comment,
        ua         => $c->req->user_agent,
        remote_ip  => $c->req->address,
        created_on => \'now()'
    });
    $c->render_json({ success => 1 });
}

1;

__END__

