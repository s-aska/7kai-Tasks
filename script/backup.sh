#!/bin/sh

mysqldump -u root doublespark --default-character-set=utf8 | gzip > /tmp/doublespark.sql.gz
mv /tmp/doublespark.sql.gz /home/aska/Dropbox/backup/
