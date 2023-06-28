# 接口监控及管理脚本

![image](https://github.com/akirasen/api-monitor-serverless/assets/41799341/92013efe-08db-41ed-8026-dbf55e700cf4)


## 使用说明
### 简介
这个脚本主要实现供多用户创建需要轮询的接口任务，并对已创建的任务进行管理。新建任务后，会每分钟1次的频率检测接口返回状态码是否按预期响应，若不符合预期，则发送短信，并记录下当次报错计数。同时将监控任务暂停，需要处理异常后重新手动启动任务。
### 创建账号
接口示例：`https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=888888888`
参数：
1.user：登录用的用户名（string）
2.psw：登陆用的密码（string）
3.mode：创建账号用的密码（int）
描述：创建账号
成功的示例：
```
{
    "reason": "新建账号成功",
    "result": {
        "id": "649bc389e766bb7691c229ed"
    }
}
```
### 新建任务
接口示例：`https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=2&exp=200&method=GET&notify=18519888855&api=https%3A%2F%2Fapis.yourdomain.cn%2Fv2%2Fapi%2Fgetlistwithphone%3Fpageindex%3D1%26pagesize%3D1`
参数：
1.user：登录用的用户名（string）
2.psw：登陆用的密码（string）
3.mode：2（只能是2）
4.exp：期望的返回HTTP状态码，例如200（int），比如期望值是200，如果接口挂了就是返回502，不匹配就会发短信向指定手机号报警
5.method：检测所用的方法，如GET、POST等
6.notify：要提醒的手机号
7.api：要监控的API地址，需要先进行UrlEncode编码
描述：新建检测任务，目前主要是检测是不是502，没有验权的401/403也可设为预期的返回状态码，因此没有考虑更多的验权传值方式，若有需求可以加。
成功的示例：
```
{
    "reason": "新建任务成功，请记录任务号id，之后用于禁用任务",
    "result": {
        "id": "649bcfdcf43e6001c1957411"
    }
}
```
### 列出任务列表
接口示例：`https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=3`
参数：
1.user：登录用的用户名（string）
2.psw：登陆用的密码（string）
3.mode：3（只能是3）
描述：根据输入的账号密码列出该用户建的任务状态及详情
成功的示例：
```
{
    "reason": "列出所有任务，state：状态，1启用，0禁用，count：监测到的异常计数",
    "list": [
        {
            "_id": "649b0464f43e6001c1552c5a",
            "api": "https://apis.yourdomain.cn/v2/api/getlistwithphone?pageindex=1&pagesize=1",
            "method": "GET",
            "expected_to": 200,
            "notify": "18588888855",
            "state": 0,
            "count": 3,
            "create_date": "2023-06-27T15:46:44.350Z",
            "last_update_date": "2023-06-28T05:55:00.636Z",
            "owner": "649af115819ce829d3cc0b9e"
        }
    ]
}
```
### 暂停或启动任务 
接口示例：`https://example.yourdomain.cn/api/http/monitor?user=admin&psw=yourpsw&mode=0&id=649b0464f43e6001c1552c5a`
参数：
1.user：登录用的用户名（string）
2.psw：登陆用的密码（string）
3.mode：0或1（只能是0或1）
4.id：任务对应的id地址，可以通过列出自己的任务查询
描述：若任务是暂停状态则启动，若启动状态则暂停
成功的示例：
```
{
    "reason": "状态已改为1：启动",
    "result": {
        "affectedDocs": 1,
        "updated": 1
    }
}
```

## 开发说明
采用Serverless开发，短信接口用了阿里云短信服务。Serverless是一种高弹性、分布式、低成本的架构，很适合屌丝全栈开发者，用过都说香，强烈推荐。我这个项目开发时图方便，是直接用了Hbuilder X集成的uniCloud-aliyun服务（本质上是阿里云EMASserverless）。
### 项目结构
需要在Hbuilder X创建uniCloud-aliyun服务环境。
云函数URL访问需要在uniCloud管理平台对http云函数设置绑定域名，绑定子目录/api。
整个脚本包括http和monitor两个云函数。需要分别在云函数目录下安装依赖：npm i
云函数http 用到了uni-cloud-router公共模块，需要在https://ext.dcloud.net.cn/plugin?id=3660 下载
```
-uniCloud-aliyun
--cloudfunctions
---http
----controller
-----http.js
----service
-----http.js
----config.js
----index.js
----package.json
---monitor
----index.js
----package.json
```
`uniCloud-aliyun/cloudfunctions/monitor/index.js` 
这个文件是轮询用的。第4-5行的阿里云短信接口相关密钥、33-34行的短信签名和模板需要提前申请并填写。模板中的需要一个`apiname`参数用于填写报错的网址。
`uniCloud-aliyun/cloudfunctions/monitor/package.json` 
第14行`"config": "0 * * * * * *"`表每分钟监测一次。
`uniCloud-aliyun/cloudfunctions/http/service/http.js`
 此文件里是脚本管理实现的主要逻辑，创建账号、创建任务、列出任务、启动或暂停任务等，可自行修改。
