---
layout: 部署
title: 部署
nav_order: 1
---

# 网站部署

网站的前后端部署采用了Gihub免费提供的Github Action进行CI/CD的自动化部署，数据库由于已经完成部署，暂时不考虑部署。Github对公共仓库提供免费的action服务器，因此部署中项目的打包均在github服务器上完成，打包的程序通过scp上传到云服务器，使用ssh基于一定的脚本完成项目的备份和服务重启。

网站的部署共包含3个工作流，工作流的具体描述下面，在使用工作流前，需要先在项目仓库配置相关的加密变量以便于工作流使用ssh连接。涉及到的变量有：

1. **SSH_HOST** : 网站部署服务器的对应公网IP地址，为了避免公网IP暴露，所有工作流中涉及公网IP的均使用改变量代替，项目代码中的可以采用域名保护
2. **SSH_SUDO** : 具有sudo的管理员账户
3. **SSH_PRIVATE_KEY** : 对应sudo账户可以用于连接的SSH密钥，阿里云使用密钥对的ssh密钥只能用于root用户登录，如果采用其他sudo用户需要手动在系统内生成密钥
4. **SSH_PORT** : SSH连接的端口，默认为22，如果留空为默认值，为了避免ssh端口爆破可以将ssh端口换成其他不常用端口
5. **SSH_DOMIAN** : 生产站点域名，例如 `cdmga.top`；该变量名沿用现有拼写，申请证书时不能填写 IP。
6. **CERTBOT_EMAIL** : Let's Encrypt 证书的联系邮箱；首次自动申请证书时必填，保留原有 `SSH_DOMIAN` 变量名即可。

配置的位置位于 **Setting**（顶部导航栏） -> **Security 下属 Secrets and variables 下属 Action**(侧边导航栏) -> **Repository secrets** 中。


## Server Initialization

网站部署的初始化工作流，存储在init.yml，完成部署网站运行的一系列所需软件、运行目录、系统服务的配置等，只能通过手动触发工作流。

在整体项目部署之前，需要先手动运行初始化工作流。

手动运行工作流的流程为：

```
 Action(顶部导航栏) -> Server Initialization（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

## env-update

安装所有运行依赖。

通过比较和上一次部署的环境是否不同决定是否更新内容。

## mvn-update 

后端的部署工作流，存储在mvn-update.yml中，完成后端程序的打包、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启为后端写的systemd守护服务webserver。

该工作流在main分支发生推送（push）和合并（merge）事件且后端项目文件夹webpage发生变化时会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

```
 Action(顶部导航栏) -> mvn-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

## pnpm-update

前端的部署工作流，存储在pnpm-update.yml中，完成前端程序的构建、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启前端部署的nginx。

该工作流在main分支发生推送（push）和合并（merge）事件且前端项目文件夹vueproject发生变化时会会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

该工作流新增dev分支推送到dev网址

```
 Action(顶部导航栏) -> pnpm-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

## 现场签到配置

管理员先发布类别为 `sign` 的课题，并将它与一场活动关联；活动与签到课题的时间都应覆盖现场签到时段。每场活动只能关联一个签到课题，一个签到课题也只能用于一场活动。管理员进入活动详情页点击“展示签到二维码”，参加者登录后扫码即可自动获得 10 分，同一活动重复扫码不会再次加分。无需新增数据库表或执行迁移脚本。

移动端顶部“扫码签到”可打开后置摄像头；浏览器不支持实时识别时，可点按识别当前画面或拍照识别。实时摄像头需要 HTTPS 访问站点，二维码图片通过现有 `/api` 反向代理上传识别，无需新增 Nginx 路由。

通过 `http://cdmga.top` 访问时，移动浏览器不会开放实时摄像头。需为 `cdmga.top` 配置可信的 TLS 证书、开放 443 端口，并将 HTTP 跳转到 HTTPS，确认 `https://cdmga.top/scan` 可访问后再测试实时扫码。上线新后端后，拍照识别的签到成绩写入会为非空图片字段填入空字符串，无需修改表结构。

首次部署 HTTPS 前，在 GitHub Actions 的 Repository secrets 中设置 `CERTBOT_EMAIL`，确认 `SSH_DOMIAN` 为实际域名 `cdmga.top`，并在阿里云安全组与服务器防火墙放通 TCP 80 和 443；域名的 DNS 解析必须指向该服务器。随后推送主分支或手动运行 `CD` 工作流。`env_update` 会调用 `script/deploy_nginx.sh`：若无证书，则自动安装 Certbot，先部署 HTTP 验证入口，用 webroot 模式申请证书，再部署仓库维护的 HTTPS 配置并将 HTTP 跳转至 HTTPS；已有证书时会跳过申请并直接部署 HTTPS 配置。Certbot 自带的定时任务负责续期，续期成功后脚本会重新加载 Nginx。申请失败时工作流报错，HTTP 配置仍可供排查；检查 80 端口、DNS 和工作流日志后重新运行即可。[Certbot 官方安装说明](https://certbot.eff.org/instructions?os=snap&ws=nginx)

部署后在服务器执行 `sudo nginx -t`、`sudo certbot renew --dry-run`，并从手机确认 `https://cdmga.top/scan` 可以打开、`http://cdmga.top/sign/11` 会跳转到 HTTPS。续期测试及部署钩子的行为见 [Certbot 官方文档](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates)。证书仅覆盖主站 `cdmga.top`；开发站 `dev.cdmga.top` 仍使用 HTTP。

生产环境建议在服务器的 `/etc/webserver.env` 中设置至少 32 字符的 `SIGN_QR_SECRET` 环境变量，`webserver.service` 会读取该文件；多实例部署时所有实例必须使用同一密钥。未设置时后端会在启动时生成临时密钥，服务重启后旧二维码会失效。设置后重启 `webserver.service`。

本功能只需发布新的前后端代码，无数据库迁移。主分支的 `CD` 工作流会依次更新服务环境、部署后端 JAR 和前端静态文件；后端构建与服务器运行环境均使用 Java 25。

HTTPS 上线后，登录等 API 请求必须一并部署更新后的后端和 Nginx 配置：后端已移除写死为 `localhost:8081` 的控制器跨域注解，在生产环境识别 Nginx 转发的 HTTPS 协议，并仅监听 `127.0.0.1:8080` 供本机 Nginx 代理。部署完成后确认登录页不再出现 `Invalid CORS request`；开发环境仍通过 `cors.allowed-origins` 配置允许本地跨域访问。

## npm-update（已弃用）

前端的早期部署工作流，存储在npm-update.yml中，完成前端程序的构建、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启前端部署的nginx。

该工作流在main分支发生推送（push）和合并（merge）事件且前端项目文件夹vueproject发生变化时会会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

```
 Action(顶部导航栏) -> npm-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```
