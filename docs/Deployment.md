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
5. **SSH_DOMIAN** : 域名，在域名未成功解析之前可以先填ip，为了避免ip泄露，在cdmga_nginx.conf文件中的监听地址用localhost代替，在部署脚本中替换为本变量名

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

## npm-update（已弃用）

前端的早期部署工作流，存储在npm-update.yml中，完成前端程序的构建、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启前端部署的nginx。

该工作流在main分支发生推送（push）和合并（merge）事件且前端项目文件夹vueproject发生变化时会会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

```
 Action(顶部导航栏) -> npm-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```