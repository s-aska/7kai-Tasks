package DoubleSpark::Web::Dispatcher;
use strict;
use warnings;
use Amon2::Web::Dispatcher::RouterSimple;

sub get($;$$) { connect_with_method('GET', @_) }
sub post($;$$) { connect_with_method('POST', @_) }

get '/' => 'Root#index';
get '/v2' => 'Root#v2';
get '/mock' => 'Root#mock';
get '/staff' => 'Root#staff';
get '/token' => 'Root#token';
get '/join/:list_id/:invite_code' => 'Root#join';
get '/manual' => 'Root#manual';

get '/signout' => 'Root#signout';

post '/signin/twitter/signin'  => 'Signin::Twitter#signin';
get '/signin/twitter/callback' => 'Signin::Twitter#callback';

post '/signin/google/signin'  => 'Signin::Google#signin';
get '/signin/google/callback' => 'Signin::Google#callback';

post '/signin/facebook/signin'  => 'Signin::Facebook#signin';
get '/signin/facebook/callback' => 'Signin::Facebook#callback';

post '/signin/email/signup' => 'Signin::Email#signup';
post '/signin/email/verify' => 'Signin::Email#verify';
post '/signin/email/signin' => 'Signin::Email#signin';

get '/api/1/account/me'              => 'API::Account#me';
post '/api/1/account/update'         => 'API::Account#update';
post '/api/1/account/update_profile' => 'API::Account#update_profile';
post '/api/1/account/delete'         => 'API::Account#delete';
post '/api/1/account/salvage'        => 'API::Account#salvage';

post '/api/1/list/create'    => 'API::List#create';
post '/api/1/list/update'    => 'API::List#update';
post '/api/1/list/invite'    => 'API::List#invite';
post '/api/1/list/disinvite' => 'API::List#disinvite';
post '/api/1/list/join'      => 'API::List#join';
post '/api/1/list/leave'     => 'API::List#leave';
post '/api/1/list/public'    => 'API::List#public';
post '/api/1/list/private'   => 'API::List#private';
post '/api/1/list/delete'    => 'API::List#delete';
post '/api/1/list/clear'     => 'API::List#clear';

post '/api/1/task/create' => 'API::Task#create';
post '/api/1/task/update' => 'API::Task#update';
post '/api/1/task/move'   => 'API::Task#move';

post '/api/1/comment/create' => 'API::Comment#create';
post '/api/1/comment/delete' => 'API::Comment#delete';
post '/api/1/comment/pin'    => 'API::Comment#pin';
post '/api/1/comment/unpin'  => 'API::Comment#unpin';

get  '/api/1/staff/stat' => 'API::Staff#stat';

get  '/api/1/request/list'   => 'API::Request#list';
post '/api/1/request/create' => 'API::Request#create';
post '/api/1/request/update' => 'API::Request#update';
post '/api/1/request/star'   => 'API::Request#star';
post '/api/1/request/unstar' => 'API::Request#unstar';

get  '/api/1/question/list'   => 'API::Question#list';
post '/api/1/question/create' => 'API::Question#create';
post '/api/1/question/update' => 'API::Question#update';
post '/api/1/question/star'   => 'API::Question#star';
post '/api/1/question/unstar' => 'API::Question#unstar';

post '/api/1/twitter/update_friends' => 'API::Twitter#update_friends';

get '/api/1/profile_image/:screen_name' => 'API::ProfileImage#twitter';
get '/api/1/profile/gravatar/:code' => 'API::ProfileImage#gravatar';

get '/public/:public_code/html' => 'API::Public#html';
get '/public/:public_code/ical' => 'API::Public#ical';
get '/public/:public_code/json' => 'API::Public#json';
get '/public/:public_code/jsonp' => 'API::Public#jsonp';
get '/public/:public_code/rss' => 'API::Public#rss';
get '/public/:public_code/atom' => 'API::Public#atom';

if ($ENV{PLACK_ENV} eq 'development') {
    warn router->as_string;
}

sub connect_with_method {
    my ($method, $path, $dest, $opt) = @_;
    $opt->{method} = $method;
    if (ref $dest) {
        connect $path => $dest, $opt;
    } elsif (not $dest) {
        connect $path => {}, $opt;
    } else {
        my %dest;
        my ($controller, $action) = split('#', $dest);
        $dest{controller} = $controller;
        $dest{action} = $action if defined $action;
        connect $path => \%dest, $opt;
    }
}

1;
