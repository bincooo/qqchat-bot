

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
// 比如我使用的clashx 代理端口7890，本机ip 10.0.20.17。那么我的docker-compose.yaml配置如下
    extra_hosts:
      - "master.io:10.0.20.17"
// src/config.ts 的代理配置
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
// 微信扫码登录阶段可用这个查看
docker logs -f [container_name or container_id]
```


## 视频教程
[在无界面Linux上部署chatgptQQ机器人](https://www.bilibili.com/video/BV1JP4y1i7Kw/)



## 本地运行

1. 首先，需要稳定干净的科学上网，能够正常登录和对话

2. 把 在`src/config.js`中配置其它配置变量。

```javascript
  // install dependencies
  npm i

  // 第一种方式:
  // dev
  npm run dev

  //第二种方式
  // build
  npm run build
  // run lib
  node lib/bundle.esm.js
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
- https://chat.openai.com/
