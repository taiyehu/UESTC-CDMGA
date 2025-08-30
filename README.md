# 社团网站相关内容

## 网站部署

网站的前后端部署采用了Gihub免费提供的Github Action进行CI/CD的自动化部署，数据库由于已经完成部署，暂时不考虑部署。Github对公共仓库提供免费的action服务器，因此部署中项目的打包均在github服务器上完成，打包的程序通过scp上传到云服务器，使用ssh基于一定的脚本完成项目的备份和服务重启。

网站的部署共包含3个工作流，工作流的具体描述下面，在使用工作流前，需要先在项目仓库配置相关的加密变量以便于工作流使用ssh连接。涉及到的变量有：

1. **SSH_HOST** : 网站部署服务器的对应公网IP地址，为了避免公网IP暴露，所有工作流中涉及公网IP的均使用改变量代替，项目代码中的可以采用域名保护
2. **SSH_SUDO** : 具有sudo的管理员账户
3. **SSH_PRIVATE_KEY** : 对应sudo账户可以用于连接的SSH密钥，阿里云使用密钥对的ssh密钥只能用于root用户登录，如果采用其他sudo用户需要手动在系统内生成密钥
4. **SSH_PORT** : SSH连接的端口，默认为22，如果留空为默认值，为了避免ssh端口爆破可以将ssh端口换成其他不常用端口
5. **SSH_DOMIAN** : 域名，在域名未成功解析之前可以先填ip，为了避免ip泄露，在cdmga_nginx.conf文件中的监听地址用localhost代替，在部署脚本中替换为本变量名

配置的位置位于 **Setting**（顶部导航栏） -> **Security 下属 Secrets and variables 下属 Action**(侧边导航栏) -> **Repository secrets** 中。


### Server Initialization

网站部署的初始化工作流，存储在init.yml，完成部署网站运行的一系列所需软件、运行目录、系统服务的配置等，只能通过手动触发工作流。

在整体项目部署之前，需要先手动运行初始化工作流。

手动运行工作流的流程为：

```
 Action(顶部导航栏) -> Server Initialization（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

### mvn-update 

后端的部署工作流，存储在mvn-update.yml中，完成后端程序的打包、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启为后端写的systemd守护服务webserver。

该工作流在main分支发生推送（push）和合并（merge）事件且后端项目文件夹webpage发生变化时会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

```
 Action(顶部导航栏) -> mvn-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

### npm-update

前端的部署工作流，存储在mvn-update.yml中，完成前端程序的构建、上传、部署、将旧的版本存到备份中、清楚7天前的备份文件、重启前端部署的nginx。

该工作流在main分支发生推送（push）和合并（merge）事件且前端项目文件夹vueproject发生变化时会会自动触发，也可以手动触发，如果初次部署且没有发生推送和合并事件时，可以手动触发工作流。

```
 Action(顶部导航栏) -> npm-update（侧边导航栏） -> Run Workflow(主界面右上角) -> Run Workflow(弹窗) 
```

## 运行环境

整个项目目前运行的服务器系统为**ubuntu-22.04-LST**（LST为长期支持版，标注22.04的和标注22.04-LST的ubuntu系统均可使用）。

项目的前端由vue构建，使用的Node版本为Node 20，部署在nginx下运行，并由nginx进行后端项目的反向代理。

项目的后端由maven（mvn）管理，基于Spring boot开发，基于java-17运行。

由于浏览器前后端涉及到跨域问题，在开发环境下跨域由后端处理，在生产环境下，跨域由nginx反向代理解决。

项目的数据库基于MYSQL进行开发。

项目的部署流程使用Github Action进行CI/CD的自动化部署。

## 开发

项目的开发环境建议使用与部署目标环境相同的**ubuntu-22.04-LST**，在由于脚手架的一致性，因此在windows下也能进行开发，如果使用安装了**ubuntu-22.04-LST**的WSL、VMware等虚拟机，在开发环境的部署上比windows下的部署方便一些。

### ubuntu-22.04-LST下的开发环境

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

### Windows下的开发环境

在windows下需要配置多个项目的依赖软件，需要为前端配置npm, node.js, element, axios, Vue CLI等软件，为后端配置maven, springboot, junittest等软件，当软件运行报错时，根据报错信息补上对应的软件即可。相关软件的下载均可用搜索引擎搜到官网直接下载安装包并使用。

### 前端的开发和部署

前端项目的开发需要在命令行进入vueproject/文件夹下，首先根据 package.json 安装项目所需的所有依赖，使用命令

```Bash
npm install 
```

或

```Bash
npm i
```

接着执行

```Bash
npm run serve
```

即可运行前端项目，此时复制出现的http://localhost:8081或带ip的地址到浏览器中即可查看vue项目的效果，在项目运行下修改代码也可即刻反映在浏览器中。

前端的部署前要先进行打包

```Bash
npm run build
```

打包后的整个前端项目在前端项目文件夹vueproject/下的dist/文件夹下，将dist文件夹复制到nginx的前端运行文件夹即可完成部署，部署后重启nginx项目。


### 后端的开发和部署

后端项目的开发需要在命令行进入webpage文件夹下，直接执行

```Bash
mvn spring-boot:run
```

即可在开发环境下使用后端，如果遇到缓存问题可以使用

```Bash
mvn clean spring-boot:run
```

重新下载依赖并构建项目。

运行junittest可以使用（没有具体用过，如果有误请修改）

```Bash
mvn test
```

后端的部署前也需要进行打包

```Bash
mvn clean package -P prod
```

打包后的文件在webpade/文件夹下的target/文件夹下，为webpage-版本号.jar文件

在webpage路径下使用

```Bash
java -jar /target/webpage-版本号.jar &
```

即可在后台运行。

如果要保证部署的稳定性，可以利用systemd使用script中的webserver来守护运行，或者使用nohup来守护运行。

```Bash
nohup java -jar /target/webpage-版本号.jar &
```

systemd的运行方法见init.yml。
