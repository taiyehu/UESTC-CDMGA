---
title: 开发环境
nav_order: 2
parent: 前端
---

# 前端的开发和部署

前端项目的开发需要在命令行进入vueproject/文件夹下，首先根据 package.json 安装项目所需的所有依赖，使用命令
```Bash
sudo corepack enable pnpm
corepack use pnpm@10.30.0
pnpm --version
```

接着执行

```Bash
pnpm install

# 2. 首次需要批准构建脚本（只需一次），选择a
pnpm approve-builds

# 3. 如果这是第一次批准，重建一次
pnpm rebuild

# 4. 启动项目
pnpm dev

```

前端有路由守护，因此需要运行后端才可以进入前端其他界面。

>换源
>国内镜像较慢，可以执行`pnpm config set registry https://registry.npmmirror.com`进行换源操作



即可运行前端项目，此时复制出现的http://localhost:8081或带ip的地址到浏览器中即可查看vue项目的效果，在项目运行下修改代码也可即刻反映在浏览器中。

前端的部署前要先进行打包

```Bash
pnpm build
```

打包后的整个前端项目在前端项目文件夹vueproject/下的dist/文件夹下，将dist文件夹复制到nginx的前端运行文件夹即可完成部署，部署后重启nginx项目。