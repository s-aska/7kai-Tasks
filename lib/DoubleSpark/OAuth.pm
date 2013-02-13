package DoubleSpark::OAuth;
use strict;
use warnings;
use Log::Minimal;
use OAuth::Lite::ServerUtil;
use OAuth::Lite::Token;
use OAuth::Lite::Util qw(parse_auth_header);
use String::Random qw(random_regex);

sub new { bless {}, $_[0]; }

__PACKAGE__->mk_accessors(qw/
    app
    error
    callback_url
    request_token
    access_token
/);

sub verify {
    my ($self, $c, $type) = @_;

    my $db = $c->db;
    my $req = $c->req;
    my $realm;
    my $oauth_params = $req->parameters->mixed;
    my $authorization = $req->headers->header('Authorization');
    if ($authorization && $authorization =~ /^\s*OAuth/) {
        ($realm, $oauth_params) = parse_auth_header($authorization);
    }
    my $token_secret;
    my ($app_id, $consumer_key) = split '-', $oauth_params->{oauth_consumer_key};
    my $timestamp = $oauth_params->{oauth_timestamp};
    my $nonce     = $oauth_params->{oauth_nonce};

    $self->check_nonce_and_timestamp($db, $consumer_key, $nonce, $timestamp) or return;

    my $util = OAuth::Lite::ServerUtil->new( strict => ($type eq 'protected resource' ? 0 : 1) );
    $util->support_signature_method('HMAC-SHA1');

    if ($type eq 'request token') {
        $util->allow_extra_params(qw/oauth_callback oauth_body_hash/);
        my $callback_url = $oauth_params->{oauth_callback} // '';
        $self->callback_url($callback_url);
    } elsif ($type eq 'access token') {
        $util->allow_extra_params(qw/oauth_verifier oauth_body_hash/);
        my $oauth_token  = $oauth_params->{oauth_token} // '';
        my $verifier     = $oauth_params->{oauth_verifier} // '';
        my ($request_token_id, $token) = split '-', $oauth_token;
        my $request_token = $db->single('request_token', {
            request_token_id => $request_token_id,
            token => $token
        });
        unless ($request_token) {
            $self->error('missing request_token');
            return;
        }
        $self->request_token($request_token);
        unless ($request_token->is_authorized_by_user) {
            $self->error('no is_authorized_by_user');
            return;
        }
        unless ($verifier eq $request_token->verifier) {
            warnf('oauth_verifier %s', $verifier);
            $self->error('invalid oauth_verifier');
            return;
        }
        $token_secret = $request_token->secret;
    } elsif ($type eq 'protected resource') {
        my $oauth_token  = $oauth_params->{oauth_token} // '';
        my ($access_token_id, $token) = split '-', $oauth_token;
        my $access_token = $db->single('access_token', {
            access_token_id => $access_token_id,
            access_token => $token
        });
        unless ($access_token) {
            $self->error('missing access_token');
            return;
        }
        $self->access_token($access_token);
        $token_secret = $access_token->access_token_secret;
    }
    unless ($util->validate_params($oauth_params, $token_secret ? 1 : 0)) {
        $self->error($util->errstr . ' ' . join ', ', keys %$oauth_params);
        return;
    }

    my $app = $db->single('app', { app_id => $app_id, consumer_key => $consumer_key });
    unless ($app) {
        $self->error('invalid consumer_key');
        return;
    }
    $self->app($app);

    unless ($util->verify_signature(
        method          => $req->method,
        params          => $oauth_params,
        url             => $req->uri,
        consumer_secret => $app->consumer_secret,
        token_secret    => $token_secret,
    )) {
        $self->error('invalid signature.');
        return;
    }
    1;
}

sub get_request_token {
    my ($self, $c) = @_;

    $self->verify($c, 'request token') or return;

    my $db = $c->db;
    my $app = $self->app;

    my $token = OAuth::Lite::Token->new_random;
    my $request_token = $db->insert('request_token', {
        app_id       => $app->app_id,
        token        => $token->token,
        secret       => $token->secret,
        realm        => 'https://tasks.7kai.org/api/',
        consumer_key => $app->consumer_key,
        callback_url => $self->callback_url,
        created_on   => \'now()',
    });
    $token->token($request_token->request_token_id . '-' . $token->token);
    $token->callback_confirmed(1);
    $token;
}

sub get_access_token {
    my ($self, $c) = @_;

    $self->verify($c, 'access token') or return;

    my $db = $c->db;
    my $app = $self->app;

    my $access_token = $db->insert('access_token', {
        app_id              => $app->app_id,
        account_id          => $self->request_token->account_id,
        access_token        => random_regex('[a-zA-Z0-9]{24}'),
        access_token_secret => random_regex('[a-zA-Z0-9]{32}'),
        access_level        => $app->access_level,
        authenticated_on    => \'now()',
        created_on          => \'now()',
    });
    $app->update_tokens();
    $self->access_token($access_token);
    my $token = OAuth::Lite::Token->new;
    $token->token($access_token->access_token_id . '-' . $access_token->access_token);
    $token->secret($access_token->access_token_secret);
    $token;
}

sub get_account {
    my ($self, $c) = @_;

    $self->verify($c, 'protected resource') or return;
    return $c->db->single('account', {
        account_id => $self->access_token->account_id
    });
}

sub check_nonce_and_timestamp {
    my ($self, $db, $consumer_key, $nonce, $timestamp) = @_;

    unless ($consumer_key && $nonce && $timestamp) {
        my $error = '';
        $error = 'missing oauth_consumer_key.' unless $consumer_key;
        $error.= 'missing oauth_nonce.'        unless $nonce;
        $error.= 'missing oauth_timestamp.'    unless $timestamp;
        $self->error($error);
        return;
    }

    my $count = $db->count('request_log', '*', {
        consumer_key => $consumer_key,
        nonce        => $nonce,
        timestamp    => { '>' => $timestamp },
    });
    if ($count > 0) {
        $self->error('timestamp refused.');
        return;
    }

    $db->insert('request_log', {
        consumer_key => $consumer_key,
        nonce        => $nonce,
        timestamp    => $timestamp,
    });

    return 1;
}

sub mk_accessors {
    my $package = shift;
    no strict 'refs';
    foreach my $field ( @_ ) {
        *{ $package . '::' . $field } = sub {
            return $_[0]->{ $field } if scalar( @_ ) == 1;
            return $_[0]->{ $field }  = scalar( @_ ) == 2 ? $_[1] : [ @_[1..$#_] ];
        };
    }
}

1;
