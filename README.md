The start of the work for our association!
You can see CDMGA on our logo for the club, that means ChengDian Music Game Association, probably.

尝试成为开发者 Day1

创建了 css 文件夹和 image 文件夹，css 文件和图片分别存放在其中

demo.html 文件就是主题的网页框架

本地开发的时候每次 commit 最好带上信息，方便查看已经完成了哪些功能

我们统一把仓库fork一份自己的仓库，本地进行一些开发之后上传到自己的仓库里，然后创建并提交pull request

请不要直接提交到taiyehu的仓库！！！

我看到之后会确认合并，这样本地工作就可以提交到远程仓库了

工作前记得 pull 或者 fetch！

2025.7.2 测试链接（ETL1224）

2025.7.2 test cikasy10

2025.7.3 test thenobody996

2025.7.9 上传了后端架构，具体如下：
    src/main/.../webpage文件夹中有所有的源文件，全部展开后分为以下几个类
        Controller类   //http相关
        Entity类       //实体类，对应数据库中的表
        Repository类   //实体类对应的接口，可自定义一些查询方法
        Service类      //通过实体类的方法编写的函数，对应特定的功能
        application类用于启动网页
    src/main/.../resources文件夹中存放静态配置文件
        static         //存放静态资源如css，jpg
        templates      //存放模板
        application.properties存放配置，如数据库连接配置
    src/test/.../文件夹中存放着测试用文件，完成功能后可以编写测试
        注意：vscode由于maven插件原因，在执行junittest之后不会正常执行System.out.println，如要进行调试可自行打断点查看获得的数据
        如果使用idea无此问题。问题解决请进行更新
    pom.xml中编写全局配置，如添加mysql依赖用于访问mysql等
