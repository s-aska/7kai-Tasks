#!/bin/sh

# crontab
# 0 4 8 * * /home/aska/tasks.7kai.org/script/renew-cert.sh

/usr/local/src/letsencrypt/letsencrypt-auto certonly --webroot -d tasks.7kai.org --webroot-path /home/aska/tasks.7kai.org/htdocs --renew-by-default
/home/aska/tasks.7kai.org/script/ct-submit.sh
