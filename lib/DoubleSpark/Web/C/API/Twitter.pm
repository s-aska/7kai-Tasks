package DoubleSpark::Web::C::API::Twitter;
use strict;
use warnings;
use Encode;
use Log::Minimal;
use JSON::XS;

sub update_friends {
    my ($class, $c) = @_;

    # my $sign_code = $c->sign_code;
    # unless ($sign_code) {
    #     warnf('[%s] update friends missing sign', $c->sign_name);
    #     return $c->res_403();
    # }
    # 
    # my $tw_account = $c->db->single('tw_account', { code => $sign_code });
    # unless ($tw_account) {
    #     warnf('[%s] update friends missign tw_account', $c->sign_name);
    #     return $c->res_403();
    # }
    # 
    # $tw_account->data->{friends} = decode_json(encode_utf8($c->req->param('friends')));
    # 
    # $tw_account->update({
    #     data       => $tw_account->data,
    #     updated_on => \'now()'
    # });
    # 
    # infof('[%s] update friends', $c->sign_name);

    $c->render_json({ success => 1 });
}

1;
