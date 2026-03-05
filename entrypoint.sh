#!/bin/bash
# 起動時に環境変数から _env.js を生成
node /var/www/html/build.js
# Apacheを起動
exec apache2-foreground
