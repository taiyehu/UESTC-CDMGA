#!/usr/bin/env bash
set -euo pipefail

domain=${1:?Pass the production domain as the first argument}
email=${2:-}
source_dir=/opt/webserver/script
config_path=/etc/nginx/sites-available/cdmga_nginx.conf
certificate_dir="/etc/letsencrypt/live/$domain"

if [[ ! $domain =~ ^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$ ]] || [[ $domain =~ ^[0-9.]+$ ]]; then
    echo "A DNS domain is required for HTTPS: $domain" >&2
    exit 1
fi

sudo mkdir -p /etc/nginx/snippets /var/www/letsencrypt/.well-known/acme-challenge
sudo install -m 644 "$source_dir/cdmga_assets.conf" /etc/nginx/snippets/cdmga_assets.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn "$config_path" /etc/nginx/sites-enabled/cdmga_nginx.conf

apply_config() {
    local template=$1
    local rendered backup
    rendered=$(mktemp)
    backup=$(mktemp)

    sed -e "s/server_name localhost;/server_name $domain;/" \
        -e "s/server_name dev.localhost;/server_name dev.$domain;/" \
        -e "s@/live/localhost/@/live/$domain/@g" \
        "$template" > "$rendered"

    if sudo test -f "$config_path"; then
        sudo cp "$config_path" "$backup"
    else
        : > "$backup"
    fi

    sudo install -m 644 "$rendered" "$config_path"
    if ! sudo nginx -t; then
        echo "Nginx configuration failed validation; restoring the previous file" >&2
        if [[ -s $backup ]]; then
            sudo install -m 644 "$backup" "$config_path"
        else
            sudo rm -f "$config_path" /etc/nginx/sites-enabled/cdmga_nginx.conf
        fi
        rm -f "$rendered" "$backup"
        exit 1
    fi
    sudo systemctl reload-or-restart nginx
    rm -f "$rendered" "$backup"
}

if ! command -v certbot >/dev/null 2>&1; then
    if ! command -v snap >/dev/null 2>&1; then
        sudo apt-get update
        sudo apt-get install -y snapd
    fi
    sudo snap install --classic certbot
    sudo ln -sfn /snap/bin/certbot /usr/local/bin/certbot
fi
certbot_bin=$(command -v certbot)

if ! sudo test -s "$certificate_dir/fullchain.pem" || ! sudo test -s "$certificate_dir/privkey.pem"; then
    if [[ -z $email ]]; then
        echo "CERTBOT_EMAIL must be configured before requesting the first certificate" >&2
        exit 1
    fi
    if [[ ! $email =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
        echo "CERTBOT_EMAIL is not a valid email address" >&2
        exit 1
    fi

    apply_config "$source_dir/cdmga_nginx.conf"
    sudo "$certbot_bin" certonly --webroot \
        --webroot-path /var/www/letsencrypt \
        --cert-name "$domain" -d "$domain" \
        --non-interactive --agree-tos --email "$email" --keep-until-expiring
fi

apply_config "$source_dir/cdmga_nginx_https.conf"
sudo install -d -m 755 /etc/letsencrypt/renewal-hooks/deploy
sudo install -m 755 "$source_dir/reload_nginx_after_renewal.sh" \
    /etc/letsencrypt/renewal-hooks/deploy/reload_nginx_after_renewal.sh

echo "HTTPS configured for $domain; Certbot will renew the certificate automatically"
