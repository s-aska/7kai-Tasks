#!/bin/sh

exec /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/start_server \
--port=5007 \
--interval=3 \
-- /home/aska/perl5/perlbrew/perls/perl-5.14.2/bin/plackup \
-E deployment \
-s Starlet \
--max-workers=20 \
-a /home/aska/github/7kai-Tasks/app.psgi