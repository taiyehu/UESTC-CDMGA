#!/usr/bin/env bash
set -euo pipefail
umask 077

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture_root="${XDG_DATA_HOME:-$HOME/.local/share}/cdmga-synthetic"
fixture_root="$(realpath -m "$fixture_root")"
case "$fixture_root/" in "$repo_root/"*) echo 'Fixture storage must be outside the repository.' >&2; exit 1;; esac
fixture_port=13307
fixture_db=CDMGA_SYNTHETIC
fixture_socket="$fixture_root/mysql.sock"

mysql_local() { mariadb --no-defaults --protocol=socket --socket="$fixture_socket" -u "$(id -un)" "$@"; }

start_db() {
    for tool in mariadbd mariadb-install-db mariadb openssl mvn; do
        command -v "$tool" >/dev/null || { echo "Missing dependency: $tool" >&2; exit 1; }
    done
    mkdir -p "$fixture_root"
    chmod 700 "$fixture_root"
    if [[ -S "$fixture_socket" ]] && mysql_local -Nse 'SELECT 1' >/dev/null 2>&1; then
        [[ "$(mysql_local -Nse 'SELECT @@port')" == "$fixture_port" ]] || exit 1
    else
        if [[ ! -d "$fixture_root/data/mysql" ]]; then
            mariadb-install-db --no-defaults --datadir="$fixture_root/data" \
                --auth-root-authentication-method=socket --auth-root-socket-user="$(id -un)" \
                --skip-test-db > "$fixture_root/install.log" 2>&1
        fi
        mariadbd --no-defaults --datadir="$fixture_root/data" --bind-address=127.0.0.1 \
            --port="$fixture_port" --socket="$fixture_socket" --pid-file="$fixture_root/mysql.pid" \
            --log-error="$fixture_root/mysql.log" --skip-name-resolve > "$fixture_root/server.log" 2>&1 &
        for ((attempt=0; attempt<100; attempt++)); do
            if mysql_local -Nse 'SELECT 1' >/dev/null 2>&1; then break; fi
            sleep 0.2
        done
        mysql_local -Nse 'SELECT 1' >/dev/null
    fi
    [[ "$(mysql_local -Nse 'SELECT @@port')" == "$fixture_port" ]] || exit 1
    if [[ ! -f "$fixture_root/db-password" ]]; then openssl rand -hex 24 > "$fixture_root/db-password"; fi
    if [[ ! -f "$fixture_root/account-password" ]]; then openssl rand -hex 12 > "$fixture_root/account-password"; fi
    local db_password
    db_password="$(< "$fixture_root/db-password")"
    [[ "$db_password" =~ ^[a-f0-9]{48}$ ]] || exit 1
    mysql_local <<SQL
CREATE DATABASE IF NOT EXISTS $fixture_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'synthetic'@'127.0.0.1' IDENTIFIED BY '$db_password';
GRANT ALL PRIVILEGES ON $fixture_db.* TO 'synthetic'@'127.0.0.1';
SQL
    printf 'Synthetic database: 127.0.0.1:%s/%s\n' "$fixture_port" "$fixture_db"
}

case "${1:-verify}" in
    start) start_db ;;
    serve)
        start_db
        export SPRING_DATASOURCE_URL="jdbc:mysql://127.0.0.1:$fixture_port/$fixture_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai"
        export SPRING_DATASOURCE_USERNAME=synthetic
        export SPRING_DATASOURCE_PASSWORD="$(< "$fixture_root/db-password")"
        export SERVER_ADDRESS=127.0.0.1
        export SERVER_SERVLET_SESSION_COOKIE_SECURE=false
        export SPRING_JPA_HIBERNATE_DDL_AUTO=validate
        export COURSE_UPLOAD_DIRECTORY="$fixture_root/uploads/images/"
        export SCORE_UPLOAD_DIRECTORY="$fixture_root/uploads/scores/"
        export AVATAR_UPLOAD_DIRECTORY="$fixture_root/uploads/avatars/"
        export ACTIVITY_UPLOAD_BANNER_DIRECTORY="$fixture_root/uploads/banners/"
        export ACTIVITY_UPLOAD_FILE_DIRECTORY="$fixture_root/uploads/files/"
        export FORUM_UPLOAD_DIRECTORY="$fixture_root/uploads/forum/"
        export CORS_ALLOWED_ORIGINS='http://localhost:5174,http://localhost:8081'
        cd "$repo_root/webpage"
        exec mvn -q spring-boot:run -Dspring-boot.run.profiles=synthetic-fixture
        ;;
    seed|verify)
        start_db
        export DSH_SYNTHETIC_TESTS=true
        export DSH_SYNTHETIC_ROOT="$fixture_root"
        export DSH_SYNTHETIC_DB_PASSWORD="$(< "$fixture_root/db-password")"
        export DSH_SYNTHETIC_ACCOUNT_PASSWORD="$(< "$fixture_root/account-password")"
        cd "$repo_root/webpage"
        mvn -q -Dtest=SyntheticDatabaseIntegrationTests test > "$fixture_root/verification.log" 2>&1 || {
            printf 'Verification failed; local log: %s/verification.log\n' "$fixture_root" >&2
            exit 1
        }
        printf 'Synthetic fixtures and HTTP checks passed. Local logs/passwords: %s\n' "$fixture_root"
        ;;
    stop)
        if [[ -S "$fixture_socket" ]]; then mysql_local -e SHUTDOWN; fi
        ;;
    *) echo 'Usage: bash script/synthetic-db.sh [start|seed|verify|serve|stop]' >&2; exit 1 ;;
esac
