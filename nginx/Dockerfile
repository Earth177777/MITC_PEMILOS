FROM nginx:1.25-alpine

RUN apk update && \
    apk add --no-cache --repository http://dl-cdn.alpinelinux.org/alpine/edge/community \
    certbot \
    py3-certbot-nginx \
    python3 \
    && pip3 install --prefix=/usr certbot-dns-digitalocean

ENV PATH="/usr/bin:$PATH"

# Copy SSL configuration
COPY sites-available/ /etc/nginx/sites-available/
RUN ln -s /etc/nginx/sites-available/election-system-ssl /etc/nginx/sites-enabled/