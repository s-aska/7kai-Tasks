package DoubleSpark::Web::Dispatcher;
use strict;
use warnings;
use Amon2::Web::Dispatcher::RouterSimple;

connect '/' => { controller => 'Root', action => 'index' };
connect '/signin/twitter/:action' => { controller => 'Signin::Twitter' };
connect '/signout' => { controller => 'Root', action => 'signout' };
connect '/chrome/viewer' => { controller => 'Root', action => 'viewer' };

# connect '/{action}' => { controller => 'Root' };
# 
# connect '/{controller}/{action}' => {}, {
#     on_match => sub {
#         my($env, $match) = @_;
#         $match->{controller} = ucfirst $match->{controller};
#         return 1;
#     }
# };

connect '/api/1/account/' => { controller => 'API::Account', action=> 'get' }, { method => 'GET' };
connect '/api/1/account/:action' => { controller => 'API::Account' };
connect '/api/1/contact/:action' => { controller => 'API::Contact' };
connect '/api/1/list/:action' => { controller => 'API::List' }, { method => 'POST' };
connect '/api/1/list/:list_id' => { controller => 'API::List', action => 'get' }, { method => 'GET' };
connect '/api/1/task/:action' => { controller => 'API::Task' }, { method => 'POST' };
connect '/api/1/comment/:action' => { controller => 'API::Comment' }, { method => 'POST' };

# connect '/api/1/{controller}/{action}' => {}, {
#     on_match => sub {
#         my($env, $match) = @_;
#         $match->{controller} = 'API::' . ucfirst $match->{controller};
#         return 1;
#     }
# };

1;
