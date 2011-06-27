use ExtUtils::MakeMaker;

WriteMakefile(
    NAME          => 'DoubleSpark',
    AUTHOR        => 'Some Person <person@example.com>',
    VERSION_FROM  => 'lib/DoubleSpark.pm',
    PREREQ_PM     => {
        'Amon2'                           => '2.37',
        'Text::Xslate'                    => '1.1005',
        'Text::Xslate::Bridge::TT2Like'   => '0.00008',
        'Plack::Middleware::ReverseProxy' => '0.09',
        'HTML::FillInForm::Lite'          => '1.09',
        'Time::Piece'                     => '1.20',

        'AnyEvent::CouchDB'               => '1.24',
        'Facebook::Graph'                 => '1.0300',
        'Net::Twitter::Lite'              => '0.10004',
        'Path::Class'                     => '0.24',
        'Sub::Retry'                      => '0.03',
        'Teng'                            => '0.11',
    },
    MIN_PERL_VERSION => '5.008001',
    (-d 'xt' and $ENV{AUTOMATED_TESTING} || $ENV{RELEASE_TESTING}) ? (
        test => {
            TESTS => 't/*.t xt/*.t',
        },
    ) : (),
);
