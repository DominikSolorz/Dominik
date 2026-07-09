#!/usr/bin/env bash
set -euo pipefail

ZIP_PATH="${1:-/tmp/linktalk-ovh-site.zip}"
LEGACY_ZIP_PATH="/tmp/bliskochat-ovh-site.zip"
APP_ROOT="/var/www/linktalk"
NGINX_SITE="/etc/nginx/sites-available/linktalk"
DOMAIN="${DOMAIN:-linktalk.pl}"
WWW_DOMAIN="${WWW_DOMAIN:-www.linktalk.pl}"
PUBLIC_IPV4="${PUBLIC_IPV4:-146.59.93.168}"
PUBLIC_HOSTNAME="${PUBLIC_HOSTNAME:-vps-a3ea02a0.vps.ovh.net}"

if [[ ! -f "$ZIP_PATH" && -f "$LEGACY_ZIP_PATH" ]]; then
  ZIP_PATH="$LEGACY_ZIP_PATH"
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Brak archiwum: $ZIP_PATH"
  exit 1
fi

write_http_config() {
  sudo tee "$NGINX_SITE" >/dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name ${PUBLIC_IPV4} ${PUBLIC_HOSTNAME} _;
    root ${APP_ROOT};
    index index.html;

    location = /config.js {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }

    location /.well-known/acme-challenge/ {
        root ${APP_ROOT};
        try_files \$uri =404;
    }

    location /downloads/ {
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
}

server {
    listen 80;
    listen [::]:80;

    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${APP_ROOT};
    index index.html;

    location = /config.js {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }

    location /.well-known/acme-challenge/ {
        root ${APP_ROOT};
        try_files \$uri =404;
    }

    location /downloads/ {
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
}
EOF
}

write_https_config() {
  local cert_dir="/etc/letsencrypt/live/${DOMAIN}"
  sudo tee "$NGINX_SITE" >/dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name ${PUBLIC_IPV4} ${PUBLIC_HOSTNAME} _;
    root ${APP_ROOT};
    index index.html;

    location = /config.js {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }

    location /.well-known/acme-challenge/ {
        root ${APP_ROOT};
        try_files \$uri =404;
    }

    location /downloads/ {
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
}

server {
    listen 80;
    listen [::]:80;

    server_name ${DOMAIN} ${WWW_DOMAIN};

    location /.well-known/acme-challenge/ {
        root ${APP_ROOT};
        try_files \$uri =404;
    }

    location / {
        return 301 https://${DOMAIN}\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name ${WWW_DOMAIN};
    ssl_certificate ${cert_dir}/fullchain.pem;
    ssl_certificate_key ${cert_dir}/privkey.pem;
    return 301 https://${DOMAIN}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name ${DOMAIN};
    root ${APP_ROOT};
    index index.html;

    ssl_certificate ${cert_dir}/fullchain.pem;
    ssl_certificate_key ${cert_dir}/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location = /config.js {
        add_header Cache-Control "no-store";
        try_files \$uri =404;
    }

    location /downloads/ {
        try_files \$uri =404;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/manifest+json;
}
EOF
}

sudo apt update
sudo apt install -y nginx unzip certbot python3-certbot-nginx

if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
  sudo ufw allow OpenSSH || true
  sudo ufw allow "Nginx Full" || true
fi

sudo mkdir -p "$APP_ROOT"
sudo rm -rf "$APP_ROOT"/*
sudo unzip -o "$ZIP_PATH" -d "$APP_ROOT"

write_http_config

sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/linktalk
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/bliskochat
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

RESOLVED_DOMAIN_IP="$(getent ahostsv4 "$DOMAIN" | awk 'NR==1 {print $1}' || true)"
RESOLVED_WWW_IP="$(getent ahostsv4 "$WWW_DOMAIN" | awk 'NR==1 {print $1}' || true)"

if [[ "$RESOLVED_DOMAIN_IP" == "$PUBLIC_IPV4" && "$RESOLVED_WWW_IP" == "$PUBLIC_IPV4" ]]; then
  sudo certbot certonly --webroot -w "$APP_ROOT" -d "$DOMAIN" -d "$WWW_DOMAIN" --agree-tos --register-unsafely-without-email --non-interactive || true
fi

if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  write_https_config
  sudo nginx -t
  sudo systemctl restart nginx
  echo "LinkTalk zostal wdrozony na https://${DOMAIN}/"
else
  echo "LinkTalk zostal wdrozony na http://${PUBLIC_IPV4}/"
  echo "HTTPS wlaczy sie automatycznie, gdy ${DOMAIN} oraz ${WWW_DOMAIN} beda wskazywac na ${PUBLIC_IPV4}."
fi
