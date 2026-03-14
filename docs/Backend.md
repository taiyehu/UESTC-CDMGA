---
title: 开发环境
nav_order: 2
parent: 后端
---

# 后端的开发和部署

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
