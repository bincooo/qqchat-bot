import { ChatGPTAPIBrowser, ChatResponse } from 'cgpt'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import { randomBytes } from 'crypto'

const MAX_DEB_COUNT = 10

function genUid(): string {
  return 'uid-' + randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

declare type Email = {
  uuid?: string,
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

  next() {
    const size = this._emails.length
    this._currentIndex ++
    if (this._currentIndex >= size) {
      this._currentIndex = 0
    }
    const account = this._emails[this._currentIndex]
    this._opts.email = account.email
    this._opts.password = account.password
    if (!account.uuid) {
      account.uuid = genUid()
    }
    return account.uuid
  }

  getOpts(): any {
    return this._opts
  }
}

export class ChatGPTHandler extends BaseMessageHandler {
  protected _api: ChatGPTAPIBrowser

  protected _uuid: string = genUid()
  
  protected _iswait: boolean = false

  protected _emailPool: EmailPool

  protected _count: number = MAX_DEB_COUNT

  async load () {
    if (!config.api.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.api.enable) return
    const { email, password, proxyServer, pingMs, slaves } = config.api
    this._emailPool = new EmailPool(
      {
        email,
        password,
        proxyServer,
        heartbeatMs: pingMs
      },
      [{ email, password, uuid: this._uuid }, ...slaves ])
    this._api = new ChatGPTAPIBrowser(this._emailPool.getOpts())
    await this._api.initSession()
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async reboot () {
    this.load()
  }

  handle = async (sender: Sender) => {
    if (!config.api.enable) return true
    try {

      if (sender.textMessage === '/cgpt reset') {
        this._iswait = false
        this._uuid = genUid()
        sender.reply('Previous conversation has been reset.', false)
        return false
      }

      let isGenTags = false
      if (sender.textMessage.startsWith('[prompt]') 
        && config.api.genTags)
      {
        isGenTags = true
        sender.textMessage = config.api.genTags
          + sender.textMessage.substr(8)
          + '\n\n仅需要给我提供prompt的内容'
      }

      if (this._iswait) {
        console.log('ignore message, is waiting ...')
        sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ~', true)
        return false
      }

      this._iswait = true
      let pref = isGenTags ? '' : await this.processPreface()

      await this._api.queueSendMessage(filterTokens(pref + sender.textMessage), {
        onProgress: async (res) => {
          if (res.error) {
            await this.messageErrorHandler(sender, res.error)
            return
          }
          if (res.response == '[DONE]') {
            this._count ++
          }
          onMessage(res, sender)
        }
      }, this._uuid)
    } catch (err) {
      await this.messageErrorHandler(sender, err)
      logger.error(err)
    }
    
    this._iswait = false
    return false
  }

  async processPreface(): Promise<string> {
    let pref = ''
    if (config.api.enablePref) {
      pref = config.api.preface
      if (!!config.api.deblocking && this._count >= MAX_DEB_COUNT) {
        await this._api.queueSendMessage(config.api.deblocking, {
          onProgress: async (res) => {
            if (res.response == '[DONE]') {
              this._count = 0
            }
          }
        }, this._uuid)
      }
    }
    return pref
  }

  async messageErrorHandler(sender: Sender, err: any) {
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
      // 429 1hours 限制, 换号处理
      this._uuid = this._emailPool.next()
      const opts = this._emailPool.getOpts()
      this._api.setAccount(opts.email, opts.password)
      try {
        await this._api.resetSession()
      } catch(e: Error) {
        console.warn(
          `chatgpt error re-authenticating ${opts.email}`,
          err.toString()
        )
      }

    } else if (err.statusCode === 403) {
      sender.reply('——————————————\nError: 403\n脑瓜子嗡嗡的, 让我缓缓 ...' + append, true)

    } else {
      sender.reply(`发生错误\n${err} ${append}`)
    }
  }
}
