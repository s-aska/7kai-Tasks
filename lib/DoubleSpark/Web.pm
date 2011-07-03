package DoubleSpark::Web;
use strict;
use warnings;
use parent qw/DoubleSpark Amon2::Web/;
use File::Spec;

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
            uri_for  => sub { Amon2->context()->uri_for(@_) },
            lang => sub {
                my $c = Amon2->context();
                return $c->lang;
            },
            is_ff => sub {
                my $c = Amon2->context();
                return 1 if $c->req->user_agent =~/Firefox/;
                return ;
            }
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
    },
);

__PACKAGE__->add_trigger(
    BEFORE_DISPATCH => sub {
        my ( $c ) = @_;
        # ...
        return;
    },
);

sub res_403 {
    my ($self) = @_;
    
    $self->create_response( 403, [], ['Forbidden'] );
}

1;
