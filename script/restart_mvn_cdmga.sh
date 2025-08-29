#!/bin/bash

# 要运行的新 jar 包路径
JAR_PATH="/var/www/app-jars/webpage-0.0.1-SNAPSHOT.jar"

# 查找占用 8080 端口的进程
PID=$(lsof -t -i:8080)

if [ -n "$PID" ]; then
  echo "发现占用8080端口的进程 PID=$PID，正在结束..."
  kill -9 $PID
  echo "进程 $PID 已结束"
else
  echo "未发现占用8080端口的进程"
fi

# 启动新的 Java 程序
echo "正在启动新的程序: $JAR_PATH"
nohup java -jar $JAR_PATH > /var/www/log/web.log 2>&1 &
echo "新程序已启动，日志输出到 web.log"