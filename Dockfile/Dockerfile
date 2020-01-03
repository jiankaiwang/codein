FROM ubuntu:18.04

MAINTAINER JianKai Wang <GLjankai@gmail.com>

RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y software-properties-common && \
    add-apt-repository ppa:ondrej/php && \
    apt-get update

RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true && \
    apt-get -q install -y \
    php7.3 \
    php-curl \
    apache2 \
    wget \
    curl \
    unzip

RUN export DEBIAN_FRONTEND=noninteractive DEBCONF_NONINTERACTIVE_SEEN=true && \
    apt-get -q update && \
    apt-get -q install -y \
    libatomic1 \
    libcurl4 \
    libxml2 \
    libedit2 \
    libsqlite3-0 \
    libc6-dev \
    binutils \
    libgcc-5-dev \
    libstdc++-5-dev \
    libpython2.7 \
    tzdata \
    git \
    pkg-config \
    && rm -r /var/lib/apt/lists/*

RUN mkdir -p /usr/swift

RUN curl -s https://swift.org/builds/swift-4.2.4-release/ubuntu1804/swift-4.2.4-RELEASE/swift-4.2.4-RELEASE-ubuntu18.04.tar.gz -o swift-4.2.4.tar.gz > /dev/null && \
    tar zxf swift-4.2.4.tar.gz && \
    mv swift-4.2.4-RELEASE-ubuntu18.04/usr /usr/swift/swift-4.2.4 && \
    rm -rf swift-4.2.4.tar.gz swift-4.2.4-RELEASE-ubuntu18.04

RUN curl -s https://swift.org/builds/swift-5.1.3-release/ubuntu1804/swift-5.1.3-RELEASE/swift-5.1.3-RELEASE-ubuntu18.04.tar.gz -o swift-5.1.3.tar.gz > /dev/null && \
    tar zxf swift-5.1.3.tar.gz && \
    mv swift-5.1.3-RELEASE-ubuntu18.04/usr /usr/swift/swift-5.1.3 && \
    rm -rf swift-5.1.3.tar.gz swift-5.1.3-RELEASE-ubuntu18.04

COPY apache_default.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
RUN wget https://codeload.github.com/jiankaiwang/codein/zip/master && \
    unzip master && \
    mv codein-master/* ./ && \
    rm -rf master ./codein-master && \
    mkdir /var/tmp/api && \
    chmod 777 -R /var/tmp/api && \
    ln -s /var/www/html/index.html /var/tmp/index.html && \
    ln -s /var/www/html/example /var/tmp/example && \
    ln -s /var/www/html/resource /var/tmp/resource && \
    ln -s /var/www/html/api/CRUD.php /var/tmp/api/ && \
    ln -s /var/www/html/api/DropboxAPI.php /var/tmp/api/ && \
    ln -s /var/www/html/api/GistAPI.php /var/tmp/api/ && \
    ln -s /var/www/html/api/exec.php /var/tmp/api/

WORKDIR /var/tmp
EXPOSE 80
CMD ["/usr/sbin/apache2ctl", "-DFOREGROUND"]
