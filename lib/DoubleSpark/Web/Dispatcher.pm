package DoubleSpark::Web::Dispatcher;
use strict;
use warnings;
use Amon2::Web::Dispatcher::RouterSimple;

connect '/' => { controller => 'Root', action => 'index' };
connect '/signin/twitter/:action' => { controller => 'Signin::Twitter' };
connect '/signout' => { controller => 'Root', action => 'signout' };
connect '/chrome/viewer' => { controller => 'Root', action => 'viewer' };
connect '/chrome/mock' => { controller => 'Root', action => 'mock' };

connect '/api/1/account/' => { controller => 'API::Account', action=> 'get' }, { method => 'GET' };
connect '/api/1/account/:action' => { controller => 'API::Account' };
connect '/api/1/contact/:action' => { controller => 'API::Contact' };
connect '/api/1/list/:action' => { controller => 'API::List' }, { method => 'POST' };
connect '/api/1/list/:list_id' => { controller => 'API::List', action => 'get' }, { method => 'GET' };
connect '/api/1/task/:action' => { controller => 'API::Task' }, { method => 'POST' };
connect '/api/1/comment/:action' => { controller => 'API::Comment' }, { method => 'POST' };

1;
