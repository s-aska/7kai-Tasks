#!/bin/sh
# eval $(perl -I ~/perl5/lib/perl5/ -Mlocal::lib)
exec PERL5LIB=/home/aska/7kai-Tasks/local/lib/perl5 /home/aska/7kai-Tasks/local/bin/start_server \
--port=5000 \
--interval=3 \
-- /home/aska/7kai-Tasks/local/bin/plackup \
-E deployment \
-s Starlet \
--max-workers=20 \
-a /home/aska/7kai-Tasks/app.psgi