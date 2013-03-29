package DoubleSpark::Web;
use strict;
use warnings;
use parent qw/DoubleSpark Amon2::Web/;
use File::Spec;
use DoubleSpark::Validator;
use DoubleSpark::Validator::Query;
use Encode qw/encode_utf8 decode_utf8/;
use Log::Minimal;
use JSON::XS qw/encode_json/;
use DoubleSpark::OAuth;

# load all controller classes
use Module::Find ();
Module::Find::useall("DoubleSpark::Web::C");

# dispatcher
use DoubleSpark::Web::Dispatcher;
sub dispatch {
    return DoubleSpark::Web::Dispatcher->dispatch($_[0]) or die "response is not generated";
}

# setup view class
use Text::Xslate;
{
    my $view_conf = __PACKAGE__->config->{'Text::Xslate'} || +{};
    unless (exists $view_conf->{path}) {
        $view_conf->{path} = [ File::Spec->catdir(__PACKAGE__->base_dir(), 'tmpl') ];
    }
    my $view = Text::Xslate->new(+{
        'syntax'   => 'TTerse',
        'module'   => [ 'Text::Xslate::Bridge::TT2Like' ],
        'function' => {
            c => sub { Amon2->context() },
            uri_with => sub { Amon2->context()->req->uri_with(@_) },
            uri_for  => sub { Amon2->context()->uri_for(@_) }
        },
        %$view_conf
    });
    sub create_view { $view }
}

# load plugins
use HTTP::Session::State::Cookie;
use HTTP::Session::Store::File;
__PACKAGE__->load_plugins(
    'Web::FillInFormLite',
    'Web::NoCache', # do not cache the dynamic content by default
    'Web::CSRFDefender' => { post_only => 1, no_validate_hook => 1 },
    'Web::HTTPSession' => {
        state => HTTP::Session::State::Cookie->new(
            expires => '+1M'
        ),
        store => HTTP::Session::Store::File->new(
            dir => File::Spec->tmpdir(),
        )
    },
);

# for your security
__PACKAGE__->add_trigger(
    AFTER_DISPATCH => sub {
        my ( $c, $res ) = @_;
        $res->header( 'X-Content-Type-Options' => 'nosniff' );
        $res->header( 'X-Frame-Options' => 'SAMEORIGIN' );
    },
);

__PACKAGE__->add_trigger(
    BEFORE_DISPATCH => sub {
        my ( $c ) = @_;

        # POST from API
        return if $c->req->path eq '/oauth/request_token';
        return if $c->req->path eq '/oauth/access_token';

        # public
        return if $c->req->path eq '/';
        return if $c->req->path eq '/v2';
        return if $c->req->path =~ m|^/join/|;
        return if $c->req->path =~ m|^/signin|;
        return if $c->req->path eq '/signout';
        return if $c->req->path eq '/token';
        # return if $c->req->path =~ m|^/api/1/proxy/|;
        return if $c->req->path =~ m|^/public/|;
        return if $c->req->path eq '/manual';
        return if $c->req->path eq '/developer/docs/api';

        if ($c->req->headers->header('Authorization') or $c->req->param('oauth_consumer_key')) {
            my $oauth = DoubleSpark::OAuth->new;
            my $account = $oauth->get_account($c);
            if ($account) {
                if ($oauth->access_token->access_level eq 'r') {
                    unless ($c->req->path eq '/api/1/account/me') {
                        return $c->res_401('this token read only.');
                    }
                }
                $c->{account} = $account;
                $c->{sign} = {
                    account_id => $account->account_id,
                    name       => $account->data->{name},
                    icon       => $account->data->{icon},
                };
            }
        } else {
            unless ($c->validate_csrf()) {
                warnf('CSRFDefender IP:%s UA:%s', $c->req->address, $c->req->user_agent);
                return $c->res_403('CSRFDefender.');
            }
        }

        unless ($c->sign) {
            # warnf('unsigned api access IP:%s UA:%s', $c->req->address, $c->req->user_agent);
            if ($c->req->path !~ m|^/api/|) {
                $c->session->set('next_url', $c->req->uri);
            }
            return $c->render('index.tt');
            # return $c->res_401();
        }

        # API
    },
);

# web context method
sub sign {
    my $c = shift;
    unless ($c->{sign}) {
        if (my $sign = $c->session->get('sign')) {
            my $account = $c->db->single('account', {
                account_id => $sign->{account_id}
            });
            if ($account) {
                $c->{account} = $account;
                $c->{sign} = $sign;
            } else {
                $c->session->remove('sign');
                critf('missing account in database %s', $sign->{account_id});
            }
        } else {
            debugf('missing sign in session');
        }
    }
    $c->{sign};
}

sub sign_name {
    my $c = shift;
    my $sign = $c->sign;
    $sign ? $sign->{name} : '-';
}

sub sign_code {
    my $c = shift;
    my $sign = $c->sign;
    $sign ? $sign->{code} : undef;
}

sub sign_id {
    my $c = shift;
    my $sign = $c->sign;
    $sign ? $sign->{account_id} : undef;
}

sub account {
    my $c = shift;
    $c->sign unless $c->{account};
    $c->{account};
}

sub is_owner {
    my $c = shift;
    my $account = $c->account;
    $account ? $account->is_owner : ();
}

sub stash {
    my $c = shift;
    $c->{stash} ||= {};
    $c->{stash};
}

sub res_304 {
    my $c = shift;

    my $content = 'Not Modified';
    $c->create_response(
        304,
        [
            'Content-Type' => 'text/plain',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub res_401 {
    my $c = shift;

    my $content = shift || 'Unauthorized';
    warnf($content);
    $c->create_response(
        401,
        [
            'Content-Type' => 'text/plain',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub res_403 {
    my $c = shift;

    my $content = 'Forbidden';
    $c->create_response(
        403,
        [
            'Content-Type' => 'text/plain',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub render_string {
    my $c = shift;

    my $content = shift;
    $c->create_response(
        200,
        [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

sub render_jsonp {
    my ($c, $callback, $json) = @_;

    $callback=~s|[^0-9a-zA-Z_]||g;
    $callback = 'callback' unless length $callback;
    my $content = encode_utf8($callback) . '(' . encode_json($json) . ');';
    my $encoding = $c->encoding();
    $encoding = lc($encoding->mime_name) if ref $encoding;
    $c->create_response(
        200,
        [
            'Content-Type' => "text/javascript; charset=$encoding",
            'Content-Length' => length($content),
        ],
        [$content]
    );
}

1;
