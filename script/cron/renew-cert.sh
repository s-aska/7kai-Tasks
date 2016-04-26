#!/bin/sh

# crontab
# 0 4 8 * * /home/aska/tasks.7kai.org/scripts/renew-cert.sh

/usr/local/src/letsencrypt/letsencrypt-auto certonly --webroot -d tasks.7kai.org --webroot-path /home/aska/7kai-Tasks/htdocs --renew-by-default
/home/aska/tasks.7kai.org/scripts/ct-submit.sh
