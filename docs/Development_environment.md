---
title: 开发环境
nav_order: 2
parent: 开发
---

# 开发环境

项目的开发环境建议使用与部署目标环境相同的**ubuntu-22.04-LTS**，在由于脚手架的一致性，因此在windows下也能进行开发，如果使用安装了**ubuntu-22.04-LTS**的WSL、VMware等虚拟机，在开发环境的部署上比windows下的部署方便一些。

## ubuntu-22.04-LTS下的开发环境

当前前端主线使用 React、TypeScript、Vite 和 pnpm 10.30.0；后端使用 Java 25 和 Maven Wrapper。工具版本以 `reactproject/package.json` 与 `webpage/pom.xml` 为准。

JDK 25 的完整安装步骤见 [新人运行教程](../training-guide/02-第一次在本地运行.md)；Ubuntu 22.04 的默认软件源未必提供该版本。Node 安装在系统目录时，全局 pnpm 安装可能需要 sudo；使用 nvm 时不需要。

```Bash
sudo apt update -y #更新软件源
# 按新人教程第 3 节配置 JDK 25；Ubuntu 22.04 默认包可能没有此版本
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - #添加 NodeSource 仓库
sudo apt install nodejs -y #安装 Node.js 和 npm
npm install --global pnpm@10.30.0


java -version #验证 Java
cd webpage && ./mvnw -version #验证 Maven Wrapper 和 JDK
node --version
pnpm --version #验证 pnpm


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

## Windows 下的开发环境

推荐在 Windows 上使用 WSL2 Ubuntu，并按上面的 Linux 步骤安装工具。前端日常工程为 `reactproject/`，使用 `pnpm install --frozen-lockfile`、`pnpm dev` 和 `pnpm build`；后端在 `webpage/` 使用 `./mvnw`。只有维护旧版时才需要安装 `vueproject/` 的依赖。

本地开发数据库必须使用本机数据库和独立账号。仓库示例 `application-local.properties.example` 指向 `127.0.0.1:3307/CDMGA_LOCAL`；不要把 3306 当作本地开发端口，因为它可能是连接生产环境的 SSH 隧道。
