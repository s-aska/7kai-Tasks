#!/bin/sh

exec /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/start_server \
--port=5008 \
--interval=3 \
-- /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/plackup \
-E staging \
-s Starlet \
-a /home/aska/stage/7kai-Tasks/app.psgi