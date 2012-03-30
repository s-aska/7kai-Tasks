package DoubleSpark::Web;
use strict;
use warnings;
use parent qw/DoubleSpark Amon2::Web/;
use File::Spec;
# use FormValidator::Lite;
use DoubleSpark::Validator;
use DoubleSpark::Validator::Query;
use Log::Minimal;

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
    'Web::CSRFDefender',
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
        
        my $lang = $c->req->param('lang') || $c->req->header('Accept-Language') || 'en';
        if ( $c->req->path eq '/' && (!$c->account) && $lang=~/^ja/i ) {
            use HTML::Parser;
            use Encode qw(decode_utf8 encode_utf8); 
            my $input = decode_utf8($res->body);
            my $output;
            my $inner;
            my $p = HTML::Parser->new(
                api_version => 3,
                start_h   => [ sub {
                    my ($self, $tagname, $attr, $text) = @_;
                    if (exists $attr->{'data-text-ja'} && $attr->{'data-setup'}=~/localize/) {
                        my $text = delete $attr->{'data-text-ja'};
                        $attr->{'data-setup'} =
                            join ',',
                            grep { $_ ne 'localize' }
                            split ',', $attr->{'data-setup'};
                        delete $attr->{'data-setup'} unless $attr->{'data-setup'};
                        $output.= '<' . $tagname;
                        for my $key (keys %$attr) {
                            my $val = $attr->{ $key };
                            $output.= ' ' . $key . '="' . $val . '"';
                        }
                        $output.= '>' . $text;
                        $inner++;
                    } else {
                        $output.= $text;
                    }
                }, "self, tagname, attr, text" ],
                text_h => [
                    sub {
                        my $text = shift;
                        if ($inner) {
                            undef $inner;
                            return;
                        }
                        $output.= $text;
                    }, 'dtext'
                ],
                default_h => [ sub { $output.= shift }, 'text' ],
            );
            $p->parse($input);
            $res->body(encode_utf8($output));
            $res->header( 'Content-Length' => length($res->body) );
        }
    },
);

__PACKAGE__->add_trigger(
    BEFORE_DISPATCH => sub {
        my ( $c ) = @_;

        return if $c->req->path eq '/';
        return if $c->req->path eq '/v2';
        return if $c->req->path =~m|^/join/|;
        return if $c->req->path =~m|^/signin|;
        return if $c->req->path eq '/signout';
        return if $c->req->path eq '/token';
        return if $c->req->path =~m|^/api/1/proxy/|;
        return if $c->req->path =~m|^/public/|;

        unless ($c->sign) {
#            warnf('unsigned api access IP:%s UA:%s', $c->req->address, $c->req->user_agent);
            return $c->res_401();
        }

        return if $c->req->path eq '/staff';

        if ( ( $c->req->user_agent || '' ) !~ /Chrome/ and
            ( $c->req->header('X-Requested-With') || '' ) ne 'XMLHttpRequest' ) {
#            warnf('no ajax api access IP:%s UA:%s', $c->req->address, $c->req->user_agent);
            return $c->res_401();
        }
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

    my $content = 'Unauthorized';
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

1;
