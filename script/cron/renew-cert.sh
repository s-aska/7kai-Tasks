#!/bin/sh

# crontab (root)
# 0 4 1 * * /home/aska/7kai-Tasks/script/renew-cert.sh

/usr/local/src/letsencrypt/letsencrypt-auto certonly --webroot -d tasks.7kai.org --webroot-path /home/aska/7kai-Tasks/htdocs --renew-by-default
/home/aska/tasks.7kai.org/scripts/ct-submit.sh
/etc/init.d/nginx reload
