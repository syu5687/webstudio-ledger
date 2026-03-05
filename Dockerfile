FROM php:8.1-apache

ENV PORT=8080
EXPOSE 8080

# Cloud Run用Apache設定
RUN sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

# .htaccess対応とmod_rewrite
RUN a2enmod rewrite \
 && sed -i "s/AllowOverride None/AllowOverride All/" /etc/apache2/apache2.conf

# /var/www/html にアクセス許可
RUN printf '%s\n' \
  '<Directory /var/www/html>' \
  '    Options Indexes FollowSymLinks' \
  '    AllowOverride All' \
  '    Require all granted' \
  '</Directory>' >> /etc/apache2/apache2.conf

# PHP curl拡張・Node.jsをインストール
RUN apt-get update && apt-get install -y nodejs npm libcurl4-openssl-dev && apt-get clean  && docker-php-ext-install curl

# ファイル配置
COPY . /var/www/html

# entrypoint.shに実行権限
RUN chmod +x /var/www/html/entrypoint.sh

# パーミッション
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html

WORKDIR /var/www/html

# 起動時にentrypoint.shを実行（環境変数→_env.js生成→Apache起動）
CMD ["/var/www/html/entrypoint.sh"]
