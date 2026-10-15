# 每日签到与论坛上线操作

以下命令由服务器管理员在服务器上执行；代码提交和前后端构建本身不会创建生产数据库表或上传目录。

## 1. 准备数据库

先按现有备份流程备份 `CDMGA` 数据库。把仓库中的 `sql_script/daily_checkin_forum_create.sql` 传到服务器，例如 `/tmp/daily_checkin_forum_create.sql`，然后执行：

```bash
mysql -u <数据库用户名> -p CDMGA < /tmp/daily_checkin_forum_create.sql
mysql -u <数据库用户名> -p CDMGA -e "SHOW TABLES LIKE 'forum_%'; SHOW TABLES LIKE 'daily_checkin'; SHOW TABLES LIKE 'identity_session';"
```

脚本使用 `CREATE TABLE IF NOT EXISTS`，只新增表，不修改 `identity`。需要先完成这一步，再启动新后端；否则登录和签到接口会因为缺表失败。

## 2. 准备图片目录

当前 `webserver.service` 以 `webserver` 用户运行。创建目录并授予服务进程读写权限：

```bash
sudo install -d -o webserver -g webserver -m 0750 /var/webserver/forum
sudo -u webserver test -w /var/webserver/forum && echo 'forum directory writable'
```

默认上传路径由 `forum.upload.directory=/var/webserver/forum/` 指定。论坛图片通过后端 `/api/forum/media/{文件名}` 读取，现有 Nginx 的 `/api` 反向代理即可使用，无须新增静态目录映射。后端只接受 PNG、JPEG、GIF，单张最多 5 MB；帖子最多 6 张，回复最多 1 张。

## 3. 发布与检查

数据库表和目录准备好后，按现有 Action 发布后端与前端。检查后端服务及日志：

```bash
sudo systemctl status webserver.service --no-pager
sudo journalctl -u webserver.service -n 100 --no-pager
```

用两个浏览器会话验证：同一账号当日只得到一次签到及相同运势；发帖、回复、上传图片、点赞、举报、管理员保留或删除后，前台可见状态与管理记录一致。图片上传后可检查 `/var/webserver/forum` 中是否出现 UUID 命名的文件。

## 说明

论坛内容使用软删除以保留审计记录，已隐藏或删除内容的图片仅允许管理员经后端访问。文件不会因软删除而移除。`identity_session` 用心跳记录近期在线状态，异常关页后最多约两分钟转为离线。
