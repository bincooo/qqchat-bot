import { Client, createClient, segment } from 'icqq'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import * as types from 'src/types'
import logger from 'src/util/log'
import { randomBytes } from 'crypto'
import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'

let client: Client
let messageHandler: Array<types.MessageHandler | types.BaseMessageHandler>
let timer: NodeJS.Timer | null = null
let loginType: number = 2

const dats = () => {
  return new Date()
    .getTime()
}

function genCid() {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

async function handleMessage (e) {
  const sender = new Sender(e)
  try {
    for (let i = 0; i < messageHandler.length; i++) {
      let isStop = false
      if (messageHandler[i] instanceof types.BaseMessageHandler) {
        isStop = !await (messageHandler[i] as types.BaseMessageHandler).handle(sender)
      } else if (typeof messageHandler[i] === 'function') {
        isStop = !await (messageHandler[i] as types.MessageHandler)(sender)
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

async function initIcqq (initMessageHandler?: Array<types.MessageHandler | types.BaseMessageHandler>): Promise<Client> {
  messageHandler = initMessageHandler ?? messageHandler ?? []
  await client?.logout()
  client = createClient({
    log_level: 'warn',
    data_dir: process.cwd() + '/data',
    // 1:安卓手机(默认) 2:aPad 3:安卓手表 4:MacOS 5:iPad  6:Android_8.8.88
    platform: config.oicq?.platform ?? 1
  })
  client.on('message', async e => {
    // 私信或at回复
    if (e.message_type === 'private' || e.atme) {
      if (e.nickname !== 'Q群管家') {
        handleMessage(e)
      }
    } else if(!!config.botNickname) {
      if (e.raw_message.indexOf(config.botNickname) >= 0) {
        handleMessage(e)
      }
    }
  })

  client.on('system.online', async () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    await client.sendPrivateMsg(config.adminQQ, '已上线~')
  })

  let dat: number  = 0
  client.on('notice.group.increase', async e => {
    if (e.user_id != config.botQQ) {
      const ds = dats()
      if (dat + 30000 < ds) { // 30s内只处理一次
        handleMessage(e)
        dat = ds
      }
    }
  })

  doLogin(client)
  return client
}

function doLogin (client: Client) {
  client.on('system.login.slider', function (e) {
    loginType = 0
    console.log(" ===== 预备滑块登陆 ====")
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '输入ticket：...\n', name: 'ticket' })
        .then(({ ticket }) => this.submitSlider(String(ticket).trim()))
    }
  })

  client.on('system.login.qrcode', function (e) {
    loginType = 2
    console.log(" ===== 预备扫码登陆 ====")
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '回车刷新二维码，等待扫码中...\n', name: 'enter' })
        .then(() => { this.login() })
    }
  })

  client.on('system.login.device', function (e) {
    loginType = 1
    console.log(" ===== 预备手机码登陆 ====")
    client.sendSmsCode()
    if (!config.docker) {
      inquirer.prompt({ type: 'input', message: '请输入手机验证码...\n', name: 'code' })
        .then(({ code }) => this.submitSmsCode(String(code).trim()))
    }
  })

  if (!timer && config.docker) {
    console.log(chalk.green('请在15秒内完成登录 ...'))
    timer = setInterval(() => loginHelper(client), 15 * 1000)
  }
  client.login(config.botQQ, config.botPassword)
}

function loginHelper(client) {
  // 0 滑块，1 手机码， 2扫码
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

class IcqqImpl extends types.TalkWrapper {
  protected _icqq?: Client

  get target(): any {
    return this._icqq
  }

  /**
   * 初始化处理器
   */
  async initHandlers(initMessageHandler?: (types.MessageHandler | types.BaseMessageHandler)[]) {
    this._icqq = await initIcqq(initMessageHandler)
  }

  /**
   * 基础信息
   */
  information(e: any): Record<string, (number | string)> & {
    textMessage: string
    nickname: string
    isAdmin: boolean
    group?: string
  } {
    const result :any = {
    }
    result.group = e.group
    result.nickname = e.sender?.nickname ?? e.nickname
    const userId = e.user_id ?? e.sender?.user_id
    result.userId = userId
    result.isAdmin = ( userId == config.adminQQ )
    result.textMessage = e.message?.filter(item => item.type === 'text').map(item => item.text).join().trim()
    if (!e.atme && !!config.botNickname) {
      result.textMessage = result.textMessage?.replaceAll(config.botNickname ?? '_undef___', '')?.trim()
    }
    return result
  }

  /**
   * 会话Id
   */
  sessionId(e: any): number {
    return e.group?.group_id ?? e.user_id ?? e.sender?.user_id
  }

  /**
   * 回复消息
   */
  async reply(e: any, chain: types.TalkChain[], quote: boolean = false): Promise<[boolean, any]> {
    const content = chain?.map(it => {
      switch(it.type) {
      case 'Plain':
        return it.value
      case 'Image':
        if (config.oicq.platform === 3) {
          const buffer = Buffer.from((it.value  as string).replace("base64://", ""), 'base64')
          const path = "./tmp/" + genCid() + ".png"
          const err = fs.writeFileSync(path, buffer)
          return segment.image(path)
        }
        return segment.image(it.value as string)
      case 'Voice':
        return segment.record('base64://' + it.value)
      case 'At':
        return segment.at(it.value)
      default:
        throw new Error('oicq reply error: unknown type `' + it.type + '`.')
      }
    })
    if (!content) return [ true, -1 ]
    try {
      const result = await e.reply(content, quote)
      return [ true, result.message_id ]
    } catch(err) {
      try {e.reply(`发生错误: ${err}`)} catch(e) {}
      return [ true, -1 ]
    }
  }

  /**
   * 撤回消息
   */
  async recall(target: any): Promise<boolean> {
    if (config.debug)
      console.log('sender recall message: ', target)
    if (this._icqq) {
      this._icqq.deleteMsg(target)
    }
    return true
  }
}

export default new IcqqImpl()

