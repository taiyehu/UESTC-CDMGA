#!/usr/bin/env bash
set -euo pipefail

app_dir=/home/eighteen-wang/cdmga-backend
service=cdmga-webserver.service
candidate=$(mktemp "$app_dir/app.jar.XXXXXXXX")
trap 'rm -f "$candidate"' EXIT

cat > "$candidate"
unzip -tqq "$candidate" >/dev/null
chmod 600 "$candidate"
cp -p "$app_dir/app.jar" "$app_dir/app.jar.prev"
mv "$candidate" "$app_dir/app.jar"
systemctl --user restart "$service"

for attempt in {1..30}; do
    if curl -fs -o /dev/null --max-time 3 \
        'http://100.81.22.111:18080/api/activity/list?size=1'; then
        exit 0
    fi
    sleep 2
done

cp -p "$app_dir/app.jar.prev" "$app_dir/app.jar"
systemctl --user restart "$service"
echo 'Remote Java health check failed; restored the previous JAR' >&2
exit 1
