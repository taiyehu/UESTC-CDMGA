# 每日签到与论坛上线操作

以下命令由服务器管理员在服务器上执行；代码提交和前后端构建本身不会创建生产数据库表或上传目录。

## 1. 准备数据库

先按现有备份流程备份 `CDMGA` 数据库。把仓库中的 `sql_script/daily_checkin_forum_create.sql` 传到服务器，例如 `/tmp/daily_checkin_forum_create.sql`，然后执行：

```bash
mysql -u <数据库用户名> -p CDMGA < /tmp/daily_checkin_forum_create.sql
mysql -u <数据库用户名> -p CDMGA -e "SHOW TABLES LIKE 'forum_%'; SHOW TABLES LIKE 'daily_checkin'; SHOW TABLES LIKE 'identity_session';"
```

如果此前已经运行过主脚本，本次论坛修改只需再执行增量脚本：

```bash
mysql -u <数据库用户名> -p CDMGA < /tmp/forum_edit_attachment_incremental.sql
mysql -u <数据库用户名> -p CDMGA -e "SHOW TABLES LIKE 'forum_file'; SHOW TABLES LIKE 'forum_edit_history';"
```

若是全新部署，先运行主脚本，再运行 `sql_script/forum_edit_attachment_incremental.sql`。两个 SQL 文件都需要先从仓库传到服务器示例路径。

脚本使用 `CREATE TABLE IF NOT EXISTS`，只新增表，不修改 `identity`。需要先完成这一步，再启动新后端；否则登录和签到接口会因为缺表失败。

## 2. 准备图片目录

当前 `webserver.service` 以 `webserver` 用户运行。创建目录并授予服务进程读写权限：

```bash
sudo install -d -o webserver -g webserver -m 0750 /var/webserver/forum
sudo -u webserver test -w /var/webserver/forum && echo 'forum directory writable'
```

`webserver.service` 启用了 `ProtectSystem=strict`。目录权限测试只能验证 Linux 用户权限，还必须确保服务的 `ReadWritePaths` 包含 `/var/webserver/forum`。仓库中的 `script/webserver.service` 已配置此项；部署该 service 文件后运行 `sudo systemctl daemon-reload && sudo systemctl restart webserver.service`。可用 `systemctl show webserver.service -p ReadWritePaths` 核对生效配置。

默认上传路径由 `forum.upload.directory=/var/webserver/forum/` 指定。论坛图片和附件分别通过后端 `/api/forum/media/{文件名}`、`/api/forum/file/{文件名}` 读取，现有 Nginx 的 `/api` 反向代理即可使用，无须新增静态目录映射。后端只接受 PNG、JPEG、GIF 图片，单张最多 5 MB；帖子最多 6 张图片、3 个文件，回复最多 1 张图片。文件支持 PDF、TXT、ZIP 和 Office 格式，单个最多 10 MB。

仓库中的 `script/cdmga_nginx.conf` 已把主站和开发站的 `client_max_body_size` 提至 12 MB，Spring 的单次请求限制也为 12 MB。发布时需一并应用 Nginx 配置（现有 `Environment update` Action 会检测并部署此文件）；若手动部署，更新配置后执行：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 3. 发布与检查

数据库表和目录准备好后，按现有 Action 发布后端与前端。检查后端服务及日志：

```bash
sudo systemctl status webserver.service --no-pager
sudo journalctl -u webserver.service -n 100 --no-pager
```

用两个浏览器会话验证：同一账号当日只得到一次签到及相同运势；发帖、回复、上传并预览图片、下载文件、点赞、举报、作者修改或删除、楼主删除评论、管理员保留或删除后，前台可见状态与管理记录一致。附件上传后可检查 `/var/webserver/forum` 中是否出现 UUID 命名的文件。

## 说明

论坛内容使用软删除以保留审计记录。已隐藏内容的图片仅允许作者、楼主（回复图片）和管理员访问；已删除内容的附件仅允许管理员访问。文件不会因软删除而移除。`identity_session` 用心跳记录近期在线状态，异常关页后最多约两分钟转为离线。
