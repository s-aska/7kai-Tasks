package DoubleSpark::Web::C::Apps;
use strict;
use warnings;
use Log::Minimal;

sub index {
    my ($class, $c) = @_;

    my $apps = $c->db->search_by_sql(q/
        SELECT DISTINCT app.app_id, app.*, access_token.access_token_id
        FROM access_token
        LEFT OUTER JOIN app USING(app_id)
        WHERE access_token.account_id = ?
        ORDER BY access_token.access_token_id DESC
    /, [ $c->sign_id ], 'app')->all;

    $c->render('apps/index.tt', { apps => $apps });
}

sub revoke {
    my ($class, $c) = @_;

    my $app_id = $c->req->param('app_id') || return $c->res_404();
    $c->db->delete('access_token', {
        app_id => $app_id,
        account_id => $c->sign_id,
    });
    $c->redirect('/apps/');
}

1;
