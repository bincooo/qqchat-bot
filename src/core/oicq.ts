import { Client, createClient, segment } from 'oicq'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler, MessageEvent, MessageHandler } from 'src/types'
import logger from 'src/util/log'
import { GuildApp } from 'oicq-guild'
import inquirer from 'inquirer'
import delay from 'delay'
import chalk from 'chalk'
import fs from 'fs'

let client: Client
let messageHandler: Array<MessageHandler | BaseMessageHandler>
let timer: NodeJS.Timer | null = null
let loginType: number = 2

const dats = () => {
  return new Date()
    .getTime()
}

async function handleMessage (e: MessageEvent) {
  const sender = new Sender(e)
  try {
    for (let i = 0; i < messageHandler.length; i++) {
      let isStop = false
      if (messageHandler[i] instanceof BaseMessageHandler) {
        isStop = !await (messageHandler[i] as BaseMessageHandler).handle(sender)
      } else if (typeof messageHandler[i] === 'function') {
        isStop = !await (messageHandler[i] as MessageHandler)(sender)
      }
      if (isStop) {
        return
      }
    }
  } catch (err) {
    logger.error(err)
    sender.reply(`发生错误: ${err}`)
  }
}

export function getClient(): null | Client {
  return client
}

export async function initOicq (initMessageHandler?: Array<MessageHandler | BaseMessageHandler>) {
  messageHandler = initMessageHandler ?? messageHandler ?? []
  await client?.logout()
  client = createClient(config.botQQ, {
    log_level: 'warn',
    data_dir: process.cwd() + '/data',
    platform: config.oicq?.platform ?? 1
  })
  client.on('message', async e => {
    // 私信或at回复
    if (e.message_type === 'private' || e.atme) {
      if (e.nickname !== 'Q群管家') {
        handleMessage(e)
      }
    } else if(!!config.botNickname) {
      if (e.raw_message.indexOf('@' + config.botNickname) >= 0) {
        handleMessage(e)
      }
    }
  })

  client.on('system.online', async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const ret = await client.sendPrivateMsg(config.adminQQ, '已上线~')

    const pingListener = async () => {
      const gMap = await client.getGroupList()
      console.log('group list:', Object.values(gMap).map(info => info.group_name).join(', '))
      for(let key in gMap) {
        try {
          const { message_id } = await client.sendGroupMsg(gMap[key].group_id, "  ")
          await client.deleteMsg(message_id)
        } catch(err) {
          console.log('pingListener Error!!', err)
        }
      }
    }

    await delay(3000)
    pingListener()
    // 一小时心跳一次
    setInterval(pingListener, 1000 * 60 * 60)
  })

  let dat: number  = 0
  client.on('notice.group.increase', async e => {
    if (e.user_id !== config.botQQ) {
      const ds = dats()
      if (dat + 30000 < ds) { // 30s内只处理一次
        handleMessage(e)
        dat = ds
      }
    }
  })

  // qq频道
  const app = GuildApp.bind(client)
  app.on('message', e => {
    const isAt = e.message.some(item => item.id === app.tiny_id)
    if (isAt) {
      handleMessage(e)
    }
  })

  doLogin(client)

  return client
}

function doLogin (client: Client) {

  client.on('system.login.slider', function (e) {
    loginType = 0
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '输入ticket：...\n', name: 'ticket' })
        .then(({ ticket }) => this.submitSlider(String(ticket).trim()))
    }
  })

  client.on('system.login.device', function (e) {
    loginType = 1
    client.sendSmsCode()
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '请输入手机验证码...\n', name: 'code' })
        .then(({ code }) => this.submitSmsCode(String(code).trim()))
    }
  })

  client.on('system.login.qrcode', function (e) {
    loginType = 2
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '回车刷新二维码，等待扫码中...\n', name: 'enter' })
        .then(() => { this.login() })
    }
  })

  if (!timer && config.docker) {
    console.log(chalk.green('请在15秒内完成登录 ...'))
    timer = setInterval(() => loginHelper(client), 15 * 1000)
  }
  client.login(config.botPassword)
}

function loginHelper(client) {
  switch(loginType) {
  case 0:
    fs.readFile('./ticket.txt', (err, data) => {
      if (!err) {
        const ticket = data.toString().trim()
        if (ticket) {
          console.log("submitSlider: " + ticket)
          fs.writeFile('./ticket.txt', '', (err) => {})
          client.submitSlider(ticket)
        }
      }
    })
    break
  case 1:
    fs.readFile('./ticket.txt', (err, data) => {
      if (!err) {
        const ticket = data.toString().trim()
        if (ticket) {
          console.log("submitSmsCode: " + ticket)
          fs.writeFile('./ticket.txt', '', (err) => {})
          client.submitSmsCode(ticket)
        }
      }
    })
    break
  case 2:
    client.login()
    break
  }
}
