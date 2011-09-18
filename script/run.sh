#!/bin/sh

exec /home/aska/perl5/perlbrew/perls/perl-5.12.3/bin/start_server \
--port=5007 \
--interval=3 \
--pid-file=/home/aska/Dropbox/product/7kai-Tasks/app.pid \
-- /home/aska/perl5/perlbrew/perls/perl-5.12.3/bin/plackup \
-E deployment \
-s Starlet \
--max-workers=20 \
-a /home/aska/Dropbox/product/7kai-Tasks/app.psgi