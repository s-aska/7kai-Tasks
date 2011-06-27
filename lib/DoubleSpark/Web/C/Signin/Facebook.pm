package DoubleSpark::Web::C::Signin::Facebook;
use strict;
use warnings;

# sub oauth {
#     my( $self, $c ) = @_;
#     
#     my $fb = $c->get('Facebook');
#     my $url = $fb->authorize->extend_permissions('publish_stream')->uri_as_string;
#     
#     $c->redirect($url);
# }
# 
# sub callback {
#     my( $self, $c ) = @_;
#     
#     my $code = $c->req->param('code');
#     my $fb = $c->get('Facebook');
#     $fb->request_access_token($code);
#     my $access_token = $fb->access_token;
#     my $user = $fb->fetch('me');
#     $c->session->set('fb_account', {
#         user => $user,
#         access_token => $access_token
#     });
#     $c->redirect('/');
# }

1;
