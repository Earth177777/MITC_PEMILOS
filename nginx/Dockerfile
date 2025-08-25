FROM nginx:1.25-alpine

RUN apk add --no-cache \
    certbot \
    certbot-nginx \
    python3 \
    && python3 -m ensurepip \
    && pip3 install --no-cache-dir certbot-dns-digitalocean

ENV PATH="/usr/bin:${PATH}"

RUN apk update && apk add --no-cache \
    certbot \
    certbot-nginx \
    && mkdir -p /etc/letsencrypt

ENV PATH="/usr/bin:$PATH"

COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-available/ /etc/nginx/sites-available/

RUN ln -s /etc/nginx/sites-available/election-system/* /etc/nginx/conf.d/ && \
    ln -s /etc/nginx/sites-available/election-system-ssl/* /etc/nginx/conf.d/