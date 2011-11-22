use ExtUtils::MakeMaker;

WriteMakefile(
    NAME          => 'DoubleSpark',
    AUTHOR        => 'Shinichiro Aska <s.aska.org@gmail.com>',
    VERSION_FROM  => 'lib/DoubleSpark.pm',
    PREREQ_PM     => {
        'Amon2'                           => '2.37',
        'Text::Xslate'                    => '1.1005',
        'Text::Xslate::Bridge::TT2Like'   => '0.00008',
        'Plack::Middleware::ReverseProxy' => '0.09',
        'HTML::FillInForm::Lite'          => '1.09',
        'Time::Piece'                     => '1.20',
        'SQL::Maker'                      => '1.03',

        'Crypt::SaltedHash'                   => '0.06',
        'Data::ICal'                          => '0.16',
        'Email::Sender'                       => '0.110001',
        'Email::Valid::Loose'                 => '0.05',
        'Facebook::Graph'                     => '1.0300',
        'FormValidator::Lite'                 => '0.25',
        'Furl'                                => '0.38',
        'Log::Minimal'                        => '0.08',
        'Net::Twitter::Lite'                  => '0.10004',
        'Path::Class'                         => '0.24',
        'Plack::Middleware::Scope::Container' => '0.01',
        'Scope::Container'                    => '0.04',
        'String::Random'                      => '0.22',
        'Sub::Retry'                          => '0.03',
        'Teng'                                => '0.14',
        'XML::RSS'                            => '1.49',
    },
    MIN_PERL_VERSION => '5.008001',
    (-d 'xt' and $ENV{AUTOMATED_TESTING} || $ENV{RELEASE_TESTING}) ? (
        test => {
            TESTS => 't/*.t xt/*.t',
        },
    ) : (),
);
