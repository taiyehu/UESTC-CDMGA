---
title: 开发环境
nav_order: 2
parent: 后端
---

# 后端的开发和部署

后端项目使用 Java 25。先按本地配置说明创建 ignored 的 `application-local.properties`，确认数据库只指向本机 3307，再进入 `webpage/` 使用仓库自带的 Maven Wrapper 启动本地 Profile：

```Bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

如果遇到构建缓存问题，可以先清理再启动：

```Bash
./mvnw clean spring-boot:run -Dspring-boot.run.profiles=local
```

运行自动化测试：

```Bash
./mvnw test
```

后端部署前需要打包

```Bash
./mvnw clean package -P prod
```

打包后的文件位于 `webpage/target/`，名称为 `webpage-版本号.jar`。

生产环境由 systemd 管理服务，不要在已部署机器上额外启动重复的后端进程。身份验证使用服务端 HTTP Session；API 访问由 `ApiAuthorizationInterceptor` 按公开、登录和管理员权限校验。修改权限时同步检查 React/Vue 页面实际调用的接口，并执行 `./mvnw test`。

需要在本地直接运行打包产物时使用 `java -jar target/webpage-版本号.jar`。systemd 配置见仓库部署手册及 `script/` 中对应服务文件。个人主页允许查看其他用户公开资料和已评分课题成绩；个人提交历史仅本人可读。
