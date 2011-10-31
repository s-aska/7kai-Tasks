use DoubleSpark::Config;

my $config = DoubleSpark::Config->new({
    base_url => 'http://stage.tasks.7kai.org'
});
$config->{DB}->[0] = 'dbi:mysql:dbname=doublespark_stage;sql-mode=STRICT_TRANS_TABLES';
$config;