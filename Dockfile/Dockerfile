FROM swift:3.0.2

MAINTAINER JianKai Wang <GLjankai@gmail.com>

RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y \
      apache2 \
      php7.0 \
      php7.0-cli \
      libapache2-mod-php7.0 \
      php7.0-gd \
      php7.0-json \
      php7.0-ldap \
      php7.0-mbstring \
      php7.0-mysql \
      php7.0-xml \
      php7.0-xsl \
      php7.0-zip \
      php-curl \
      wget \
      unzip

COPY apache_default.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
RUN wget https://codeload.github.com/jiankaiwang/codein/zip/version/1 && \
    unzip 1 && \
    mv codein-version-1/* ./ && \
    rm -rf 1 ./codein-version-1 && \
    ln -s /var/www/html/index.html /var/tmp/index.html && \
    ln -s /var/www/html/example /var/tmp/example && \
    ln -s /var/www/html/api /var/tmp/api && \
    ln -s /var/www/html/resource /var/tmp/resource && \
    chmod 755 -R /usr/lib/swift

WORKDIR /var/tmp
EXPOSE 80
CMD ["/usr/sbin/apache2ctl", "-DFOREGROUND"]