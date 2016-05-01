#!/bin/sh

# crontab
# 0 4 8 * * /home/aska/tasks.7kai.org/script/renew-cert.sh

/usr/local/src/letsencrypt/letsencrypt-auto certonly --webroot -d tasks.7kai.org --webroot-path /home/aska/7kai-Tasks/htdocs --renew-by-default
/home/aska/7kai-Tasks/script/ct-submit.sh
