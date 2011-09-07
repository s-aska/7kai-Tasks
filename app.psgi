use File::Spec;
use File::Basename;
use lib File::Spec->catdir(dirname(__FILE__), 'extlib', 'lib', 'perl5');
use lib File::Spec->catdir(dirname(__FILE__), 'lib');
use DoubleSpark::Web;
use Plack::Builder;

builder {
    enable 'Plack::Middleware::Static',
        path => qr{^(?:/static/|/robot\.txt$|/favicon.ico$)},
        root => File::Spec->catdir(dirname(__FILE__), 'htdocs');
    enable 'Plack::Middleware::ReverseProxy';
    enable 'Plack::Middleware::Log::Minimal', autodump => 1;
    DoubleSpark::Web->to_app();
};
