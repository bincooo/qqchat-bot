import { Client, createClient, segment } from 'oicq'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler, MessageEvent, MessageHandler } from 'src/types'
import logger from 'src/util/log'
import { GuildApp } from 'oicq-guild'
import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'

let client: Client
let messageHandler: Array<MessageHandler | BaseMessageHandler>
let timer: NodeJS.Timer | null = null
let loginType: number = 2

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
      handleMessage(e)
    }
  })

  client.on('system.online', async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const ret = await client.sendPrivateMsg(config.adminQQ, '已上线~')
  })

  client.on('notice.group.increase', async e => {
    if (e.user_id !== config.botQQ) {
      handleMessage(e)
    }
  })

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
  //   inquirer.prompt({ type: 'input', message: '输入ticket：...\n', name: 'ticket' })
  //     .then(({ ticket }) => this.submitSlider(String(ticket).trim()))
  })

  client.on('system.login.device', function (e) {
    loginType = 1
    client.sendSmsCode()
    // inquirer.prompt({ type: 'input', message: '请输入手机验证码...\n', name: 'code' })
    //   .then(({ code }) => this.submitSmsCode(String(code).trim()))
  })

  client.on('system.login.qrcode', function (e) {
    loginType = 2
  //   inquirer.prompt({ type: 'input', message: '回车刷新二维码，等待扫码中...\n', name: 'enter' })
  //     .then(() => { this.login() })
  })

  if (!timer) {
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
