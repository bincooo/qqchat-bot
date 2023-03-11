

# OpenAI QQBot

基于OpenAI官方API的QQ聊天机器人



详细指南另见 [Wiki~~](https://github.com/easydu2002/chat_gpt_oicq/wiki)





## ✨当前功能

- ✅ 支持上下文语境的对话。
- ✅ 支持重置上下文语境，通过关键词(reset)重置对话上下文语境。
- ✅ 支持在群聊@你的机器人 🤖，@机器人即可收到回复。
- ✅ 支持通过关键词唤醒你的机器人，如当在群组中发送“@机器人 hello xxxx”时才会收到回复。
- ✅ 支持 Docker 运行。
- ✅ 支持 角色扮演：具体突破ai的语境封锁请查看 https://github.com/f/awesome-chatgpt-prompts
- ✅ 支持设置重试次数，当请求 ChatGPT 错误时，会自动重试。
- ❓ 捕获错误并重试。
- ❓ 其他



## 用 Docker 运行

```
// ！！！ 注意了，用docker运行需要指定代理ip和端口，不然你即便开了科学网也不行。
// 比如我使用的clashx 代理端口7890，本机ip 10.0.20.17。macOS/linux/centOS/ubuntu/debain 等unix系统用 `ifconfig` 命令查看ip
// wrinning!! 不要填127.0.0.1
// 那么我的docker-compose.yaml配置如下
    extra_hosts:
      - "master.io:10.0.20.17"
// config.json 的代理配置, 仅修改端口即可，前面的master.io不要乱动。端口根据你的科学网络配置
proxyServer: 'http://master.io:7890',
// --------------

// *** 启动 ***
// 旧版docker：
docker-compose up -d --build
// 最新版docker：
docker compose up -d --build

// *** 停止 ***
// 旧版docker：
docker-compose down
// 最新版docker：
docker compose down

// *** 查看日志 ***
// QQ登录阶段可用这个查看
docker logs -f [container_name or container_id]

// 登录操作
// 第一次登录会要求你扫码或滑动条ticket验证
// 扫码方式直接扫码即可，滑动条方式如下操作：
// 1. 复制控制太日志里的滑动条链接，用浏览器打开后按F12，选择【网络】，滑动后点击【网络】里的链接复制ticket
// 2. 新开一个控制台输入
docker exec [container_name or container_id] Enter (你复制的ticket)

// 3. 可能还需要手机短信码验证
docker exec [container_name or container_id] Enter (你的手机短信码)

// 到这就差不多了，开始你的聊天之旅吧。。。。
```

## 配置说明

```json
// config.json

{
  // debug模式，开启后控制台会有更多的打印信息以方便排查问题
  "debug": false,
  // 是否以docker方式启动
  "docker": true,
  // 管理者QQ，启动成功后会通知这个QQ，必须是机器人QQ的好友
  "adminQQ": "xxx",
  // 机器人QQ
  "botQQ": "xxx",
  // 机器人密码，没有密码的话登录方式为扫码登录。不过这种方式应该是寄了
  "botPassword": "xxx",
  // 机器人昵称
  "botNickname": "猫小爱",
  "oicq": {
    // 登录协议：1:安卓手机(默认) 2:aPad 3:安卓手表 4:MacOS 5:iPad
    "platform": 3
  },
  // 废弃
  // 这个方式许久不维护了，我不知道还能用不 (懒
  "officialAPI": {
    "enable": false,
    "key": "123",
    "model": "text-davinci-003",
    "identity": [],
    "maxTokens": 256,
    "maxTrackCount": 1,
    "temperature": 0.9,
    "stop": [
      "Humen",
      "AI"
    ]
  },
  // web chatgpt 逆向配置
  "api": {
    // 开启 true， 关闭 false
    "enable": true,
    // openai邮箱
    "email": "xxx",
    // openai密码
    "password": "xxx",
    // openai的账号池。用来解决1hours 429问题的，会自动切换账号
    "slaves": [
      //格式
      {
        "email": "xxx",
        "password": "xxx"
      }
    ]
  },
  // 代理配置
  "proxyServer": "http://master.io:7890",
  // QQ群心跳检测，用来解决QQ群监听失效问题，不要动它
  "groupPingMs": 3600000,
  // 如上
  "groupList": {
  }
}
```



```json
// preset.json
{
  // 角色预设
  "player": [
    {
      // 启动预设的触发词
      "key": "默认",
      // 预设魔咒，支持一条文本和多条文本 (这是一条的样子
      "training": "xxxxx"
    },
    {
      "key": "喵小爱",
       // 预设魔咒，支持一条文本和多条文本 (这是多条的样子
      "training": [
        "xxxx"
      ],
      // 守护预设配置
      "maintenance": {
        // 检测条件，包含里面词条中的一个就会触发
        "condition": [
          "无法回答",
          "不能回答",
          "程序",
          "AI",
          "Ai",
          "ai",
          "语言模型",
          "违反",
          "伦理道德",
          "尊重他人"
        ],
        // 触发提醒
        "warning": "condition warning: ([!!condition!!])\n犯迷糊了~   ( ；´Д｀)",
        // 守护魔咒，只支持一条文本
        "training": "xxxx"
      }
    }
  ],
  // ai作画tag生成预设魔咒
  "novelAiHelper": "xxx",
  // 默认的预设
  "default": "xxx"
}
```



## 视频教程
[在无界面Linux上部署chatgptQQ机器人](https://www.bilibili.com/video/BV1JP4y1i7Kw/)



## 本地运行

1. 首先，需要稳定干净的科学上网，能够正常登录和对话

2. 需要GUI界面的系统，本地需要安装一个谷歌浏览器。运行后会自动打开浏览器，所以推荐使用docker部署

3. 在`config.json`中配置其它配置变量，也可以删除config.json后启动。没有config.json会出现选项让你进行配置，但docker方式不能删，只能手动修改

4. 配置后执行以下命令：

```javascript
  // install dependencies
  npm i

  // dev
  npm run dev -y
```

## 👀效果

## 常见错误码
 ```bash
  // web chatgpt 会话错误
  429  1hours 限制
  403  发送消息失败
  5001 消息队列已满
  // 自定义错误
  4001 Ai作画失败
  4002 markdown转图片失败
 ```

## 感谢

- https://github.com/takayama-lily/oicq
- https://github.com/transitive-bullshit/chatgpt-api
- https://github.com/easydu2002/chat_gpt_oicq
- https://chat.openai.com/
