# INSTALL

## Download
    git clone https://github.com/s-aska/7kai-Tasks.git
    cd 7kai-Tasks

## Setup MySQL
    mysql -u root
    mysql> create database doublespark default charset utf8;
    mysql -u root doublespark < sql/my.sql

## Install cpanm
    cd ~/bin
    curl -LO http://xrl.us/cpanm
    chmod +x cpanm

## Install CPAN Modules
    cd 7kai-Tasks
    cpanm --installdeps .

## Run (development)
    plackup -r --port 7000

## Run (deployment)
    plackup -E deployment --port 7000

## Setting URL
    vi config/development.pl

    # Sample
    use DoubleSpark::Config;
    DoubleSpark::Config->new({
        base_url => 'http://127.0.0.1:7000'
    });

## USE Google Sign In
Nothing is necessary

## USE Facebook Sign In
    echo -n "YOUR-FACEBOOK-APP-KEY" > config/fb.key
    echo -n "YOUR-FACEBOOK-APP-SECRET" > config/fb.secret

## USE Twitter Sign In
    echo -n "YOUR-Twitter-APP-KEY" > config/tw.key
    echo -n "YOUR-Twitter-APP-SECRET" > config/tw.secret