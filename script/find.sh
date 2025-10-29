#!/bin/bash
LC_ALL=C
LOGGLOB=/var/log/nginx/cdmga.access.log*
IP='38.207.160.120'
PATHSTR='/profile'

echo "=== 最近 7 天逐日匹配 ($IP 与 $PATHSTR) ==="
for i in $(seq 0 6); do
  d=$(date -d "-$i day" '+%d/%b/%Y')
  echo "----- $d -----"
  zgrep -h "$d" $LOGGLOB 2>/dev/null | grep -F "$IP" | grep -F "$PATHSTR" || true
done

echo
echo "=== 每日匹配计数 ==="
for i in $(seq 0 6); do
  d=$(date -d "-$i day" '+%d/%b/%Y')
  c=$(zgrep -h "$d" $LOGGLOB 2>/dev/null | grep -F "$IP" | grep -F "$PATHSTR" | wc -l)
  echo "$d $c"
done

echo
echo "=== 总计与最常见请求路径 (假设路径位于第7字段) ==="
total=$(zgrep -h -F "$IP" $LOGGLOB 2>/dev/null | grep -F "$PATHSTR" | wc -l)
echo "总匹配数: $total"
zgrep -h -F "$IP" $LOGGLOB 2>/dev/null | grep -F "$PATHSTR" | awk '{print $7}' | sort | uniq -c | sort -rn | head -n 50

echo
echo "=== 最近 200 条匹配（供快速查看） ==="
zgrep -h -F "$IP" $LOGGLOB 2>/dev/null | grep -F "$PATHSTR" | tail -n 200
