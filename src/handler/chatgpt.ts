import { ChatGPTAPIBrowser, ChatResponse } from 'cgpt'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import stateManager from 'src/util/state'
import { randomBytes } from 'crypto'
import { clashSetting } from 'src/util/request'
import { cgptEmitResetSession } from 'src/util/event'

const MESSAGE_TIMEOUT_MS = 1000 * 60 * 3
let countNotSigned = 0
// let count429 = 0

function genUid(): string {
  return 'uid-' + randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

declare type Email = {
  uuid?: Map<number, string>,
  email: string,
  password: string
}

class EmailPool {
  protected _emails: Array<Email>
  protected _args: any = {}
  protected _currentIndex: number = 0
  protected _opts: any

  constructor(
    opts: {
      email: string
      password: string
      proxyServer?: string
      heartbeatMs?: number
    },
    emails: Array<Email>
  ) {
    this._opts = opts
    this._emails = emails
    console.log('email pool:', emails)
  }

  next(uid: number) {
    const size = this._emails.length
    this._currentIndex ++
    if (this._currentIndex >= size) {
      this._currentIndex = 0
    }
    return this.getId(uid)
  }

  getId(uid: number): string {
    const account = this._emails[this._currentIndex]
    this._opts.email = account.email
    this._opts.password = account.password
    if (!account.uuid) {
      account.uuid = new Map<number, string>()
    }
    if (!account.uuid.has(uid)) {
      account.uuid.set(uid, genUid())
    }
    return account.uuid.get(uid)
  }

  getOpts(): any {
    return this._opts
  }

  resetCurrOpts(uid: number): string {
    const account = this._emails[this._currentIndex]
    if (!account.uuid) {
      account.uuid = new Map<number, string>()
    }
    if (account.uuid.has(uid)) {
      account.uuid.delete(uid)
    }
    account.uuid.set(uid, genUid())
    return account.uuid.get(uid)
  }
}

export class ChatGPTHandler extends BaseMessageHandler {
  protected _api: ChatGPTAPIBrowser

  protected _iswait: boolean = false

  protected _emailPool: EmailPool

  async load () {
    if (!config.api.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.api.enable) return
    const { email, password, pingMs, slaves } = config.api
    const { proxyServer, browserPath } = config
    this._emailPool = new EmailPool(
      {
        email,
        password,
        proxyServer,
        heartbeatMs: pingMs,
        executablePath: browserPath
      },
      [{ email, password }, ...slaves ])
    this._api = new ChatGPTAPIBrowser(this._emailPool.getOpts())
    await this._api.initSession()
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async reboot () {
    this.load()
  }

  handle = async (sender: Sender) => {
    if (config.debug) this._api.setDebug(config.debug)
    if (!config.api.enable) return true
    try {

      if (sender.textMessage?.trim() === '!reset') {
        this._emailPool.resetCurrOpts(sender.id)
        sender.reply('当前会话已重置 ~')
        cgptEmitResetSession(sender.id)
        return false
      }

      if (this._iswait) {
        console.log('ignore message, is waiting ...')
        sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ~', true)
        return false
      }

      const message = await filterTokens(sender.textMessage, sender)
      if (!message) {
        return false
      }

      this._iswait = true
      stateManager.sendLoading(sender, { init: true, isEnd: false })
      await this._api.queueSendMessage(message, {
        timeoutMs: MESSAGE_TIMEOUT_MS,
        onProgress: async (res) => {
          if (res.error) {
            await this.messageErrorHandler(sender, res.error)
            return
          }
          // count429 = 0
          await onMessage(res, sender)
        }
      }, this._emailPool.getId(sender.id))
    } catch (err) {
      await this.messageErrorHandler(sender, err)
    }
    
    this._iswait = false
    return false
  }

  async messageErrorHandler(sender: Sender, err: any) {
    // console.log('[chatgpt.ts] 158 messageErrorHandler', err)
    stateManager.sendLoading(sender, { init: true, isEnd: true })
    const currentTimeIsBusy = () => {
      const hour: number = new Date()
        .getHours()
      // 有时差，自行调整
      return (hour >= 12 && hour <= 22)
    }

    const append = !currentTimeIsBusy() ? ""
      : "\n——————\n\n晚上20:00 ~ 凌晨06:00为国外高峰期, 尽量避开使用哦 ~"

    // if (err instanceof ChatGPTError) {
    if (err.message === 'ChatGPT invalid session token') {
      sender.reply('token 无效' + append)

    } else if (err.statusCode === 5001) {
      sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ...' + append, true)

    } else if (err.statusCode === 429) {
      sender.reply('——————————————\nError: 429\nemmm... 你好啰嗦吖, 稍后再来吧 ...' + append, true)
      // 429 1hours 限制, 换号处理. 三次后触发
      // if (++count429 < 3) return
      // count429 = 0
      this._emailPool.next(sender.id)
      const opts = this._emailPool.getOpts()
      this._api.setAccount(opts.email, opts.password)
      this._iswait = true
      try {
        await this._api.resetSession()
        cgptEmitResetSession()
      } catch(e: Error) {
        console.warn(
          `chatgpt error re-authenticating ${opts.email}`,
          err.toString()
        )
      }
      this._iswait = false

    } else if (err.statusCode === 403) {
      sender.reply('——————————————\nError: 403\n脑瓜子嗡嗡的, 让我缓缓 ...' + append, true)
    } else if (err.message.includes('Not signed in')) {
      sender.reply(`发生错误\n${err} ${append}`)
      this.clash()

    } else {
      sender.reply(`发生错误\n${err} ${append}`)
    }
  }

  async clash() {
    if (config.clash?.enable) {
      countNotSigned++
      let { http, list, index } = config.clash
      if (!http) {
        throw new Error('please edit config.json: [ clash.http ] !')
      }
      if (!list || list.length <= 0) {
        throw new Error('please edit config.json: [ clash.list ] !')
      }

      if (countNotSigned < 2) {
        return
      }

      if (!index || index >= list.length) {
        index = 0
        config.clash.index = 0
      }
      const name = list[index]
      console.log('clash will be change to name: [' + name + '].')
      await clashSetting(name)
      countNotSigned = 0

    }
  }
}
