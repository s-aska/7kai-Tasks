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

## USE Twitter Sign In
    echo -n "YOUR-Twitter-APP-KEY" > config/tw.key
    echo -n "YOUR-Twitter-APP-SECRET" > config/tw.secret

## USE Facebook Sign In
    echo -n "YOUR-FACEBOOK-APP-KEY" > config/fb.key
    echo -n "YOUR-FACEBOOK-APP-SECRET" > config/fb.secret

## Sample configuration for hosting

### Nginx

    server {
        listen 443;
        ssl on;
        ssl_certificate /etc/nginx/7kai.crt;
        ssl_certificate_key /etc/nginx/7kai.key;
        proxy_set_header  X-Forwarded-Proto https;
        proxy_set_header  X-Real-IP       $remote_addr;
        proxy_set_header  X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header  Host            $http_host;
        proxy_redirect    off;
        proxy_max_temp_file_size          0;
        server_name tasks.7kai.org;
        access_log /var/log/nginx/tasks.7kai.org.access.log combined;
        charset utf-8;
        if ($http_user_agent ~* '(iPhone|Android)') {
            rewrite ^/$ /static/mobile/index.html;
        }
        if ($args ~ mobile=1) {
            rewrite ^/$ /static/mobile/index.html;
        }
        location /static {
            root /home/aska/github/7kai-Tasks/htdocs;
            expires 1d;
        }
        location /apple-touch-icon.png { root /home/aska/github/7kai-Tasks/htdocs; }
        location / { proxy_pass http://localhost:7000; }
    }

### Supervisord

    [program:7kai-tasks]
    user=aska
    command=/home/aska/github/7kai-Tasks/script/run.sh
    directory=/home/aska/github/7kai-Tasks
    stdout_logfile=/var/log/supervisor/7kai-tasks.log
    stderr_logfile=/var/log/supervisor/7kai-tasks-error.log
    numprocs = 1
    stdout_logfile_maxbytes = 10MB
    stderr_logfile_maxbytes = 10MB
    stdout_logfile_backups = 5
    stderr_logfile_backups = 5
    autostart = true
    autorestart = true
    startsecs = 5
    priority = 998

### run.sh

    #!/bin/sh

    exec /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/start_server \
    --port=7000 \
    --interval=3 \
    -- /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/plackup \
    -E deployment \
    -s Starlet \
    --max-workers=20 \
    -a /home/aska/github/7kai-Tasks/app.psgi
