#!/bin/bash

# MySQL数据库清理脚本
# 功能：清理标记为已删除的数据

# 数据库配置
DB_HOST="47.109.27.209"
DB_PORT="3306"
DB_NAME="CDMGA"
DB_USER="Admin_2025"
DB_PASS="Cdmga@2025"

# 日志文件
LOG_FILE="/var/log/mysql_cleanup.log"

# 函数：记录日志
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 函数：执行SQL命令
execute_sql() {
    local sql_command="$1"
    local description="$2"
    
    log_message "开始执行: $description"
    
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "$sql_command" 2>> "$LOG_FILE"
    
    if [ $? -eq 0 ]; then
        log_message "成功: $description"
    else
        log_message "错误: $description 执行失败"
        exit 1
    fi
}

# 主程序
main() {
    log_message "=== 开始数据库清理操作 ==="
    
    # 检查MySQL连接
    if ! mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" 2>/dev/null; then
        log_message "错误: 无法连接到MySQL数据库"
        exit 1
    fi
    
    # 先查询要删除的记录数（可选，用于记录）
    execute_sql "SELECT COUNT(*) AS '待删除score记录数' FROM score WHERE is_deleted = 1;" "查询待删除的score记录数"
    execute_sql "SELECT COUNT(*) AS '待删除course记录数' FROM course WHERE is_deleted = 1;" "查询待删除的course记录数"
    execute_sql "SELECT COUNT(*) AS '待删除identity记录数' FROM identity WHERE is_deleted = 1;" "查询待删除的identity记录数"
    
    # 执行删除操作
    execute_sql "DELETE FROM score WHERE is_deleted = 1;" "删除score表中已标记删除的记录"
    execute_sql "DELETE FROM course WHERE is_deleted = 1;" "删除course表中已标记删除的记录"
    execute_sql "DELETE FROM identity WHERE is_deleted = 1;" "删除identity表中已标记删除的记录"
    
    # 显示删除后的记录数
    execute_sql "SELECT COUNT(*) AS '剩余score记录数' FROM score;" "查询剩余score记录数"
    execute_sql "SELECT COUNT(*) AS '剩余course记录数' FROM course;" "查询剩余course记录数"
    execute_sql "SELECT COUNT(*) AS '剩余identity记录数' FROM identity;" "查询剩余identity记录数"
    
    log_message "=== 数据库清理操作完成 ==="
}

# 执行主程序
main