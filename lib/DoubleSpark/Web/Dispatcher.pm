package DoubleSpark::Web::Dispatcher;
use strict;
use warnings;
use Amon2::Web::Dispatcher::RouterSimple;

sub get($;$$) { connect_with_method('GET', @_) }
sub post($;$$) { connect_with_method('POST', @_) }

get '/' => 'Root#index';
get '/mock' => 'Root#mock';

get '/signout' => 'Root#signout';

post '/signin/twitter/signin' => 'Signin::Twitter#signin';
get '/signin/twitter/callback' => 'Signin::Twitter#callback';

post '/signin/facebook/signin' => 'Signin::Facebook#signin';
get '/signin/facebook/callback' => 'Signin::Facebook#callback';

post '/signin/email/signup' => 'Signin::Email#signup';
post '/signin/email/verify' => 'Signin::Email#verify';
post '/signin/email/signin' => 'Signin::Email#signin';

get '/api/1/account/me'      => 'API::Account#me';
post '/api/1/account/update' => 'API::Account#update';

post '/api/1/list/create' => 'API::List#create';
post '/api/1/list/update' => 'API::List#update';
post '/api/1/list/delete' => 'API::List#delete';
post '/api/1/list/clear'  => 'API::List#clear';

post '/api/1/task/create' => 'API::Task#create';
post '/api/1/task/update' => 'API::Task#update';
post '/api/1/task/move'   => 'API::Task#move';

post '/api/1/comment/create' => 'API::Comment#create';
post '/api/1/comment/delete' => 'API::Comment#delete';

post '/api/1/twitter/update_friends' => 'API::Twitter#update_friends';

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

# sub connect_with_method {
#     my ($method, $path, $dest_str, $opt) = @_;
#     $opt->{method} = $method;
#     my %dest;
#     if ($dest_str) {
#         my ($controller, $action) = split('#', $dest_str);
#         $dest{controller} = $controller;
#         $dest{action} = $action if defined $action;
#         connect $path => \%dest, $opt;
#     } else {
#         my ($controller, $action) = $path=~m|^/(.*?)([^/]*)$|;
#         $dest{controller} = $controller
#                             ? join('::', map { ucfirst $_ } grep /./, split '/', $controller)
#                             : 'Root';
#         $dest{action} = $action || 'index';
#         connect $path => \%dest, $opt;
#     }
# }
