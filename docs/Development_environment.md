---
title: 开发环境
nav_order: 2
parent: 开发
---

# 开发环境

项目的开发环境建议使用与部署目标环境相同的**ubuntu-22.04-LTS**，在由于脚手架的一致性，因此在windows下也能进行开发，如果使用安装了**ubuntu-22.04-LTS**的WSL、VMware等虚拟机，在开发环境的部署上比windows下的部署方便一些。

## ubuntu-22.04-LTS下的开发环境

在ubuntu22.04下默认软件仓库的Node版本为已经不提供支持的12版本，因此需要引入Node 20的软件源，开发相关的软件环境可以使用下面的命令完成安装。

```Bash
sudo apt update -y #更新软件源
sudo apt install openjdk-17-jdk -y #安装java17
sudo apt install maven -y #安装maven
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - # 添加 NodeSource 仓库
sudo apt install nodejs -y #安装node和npm


java -version #验证java
mvn -version #验证maven
node --version
npm --version #验证npn和Node


```

如果想要验证nginx部署的话，还需要安装nginx

```Bash
sudo apt update -y #更新软件源
sudo apt install nginx -y
nginx --version
```


>TIP : 在WSL或VMware中部署虚拟机后，均可以使用Windows下的VScode很方便的连接并编辑相关代码，其中WSL只需要下载VScode里的WSL扩展并选择连接主机后，就可以直接在对应文件夹使用
>```Bash
>code .
>```
>直接调用了，非常方便。

## Windows下的开发环境

在windows下需要配置多个项目的依赖软件，需要为前端配置npm, node.js, element, axios, Vue CLI等软件，为后端配置maven, springboot, junittest等软件，当软件运行报错时，根据报错信息补上对应的软件即可。相关软件的下载均可用搜索引擎搜到官网直接下载安装包并使用。