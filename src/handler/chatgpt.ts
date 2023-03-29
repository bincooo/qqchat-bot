import { ChatGPTUnofficialProxyAPI, ChatMessage } from 'chatgpt'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler, type QueueReply } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import stateManager from 'src/util/state'
import { randomBytes } from 'crypto'
import FunctionManager from 'src/util/queue'
import { cgptEmitResetSession, cgptEmitChangeAccount } from 'src/util/event'
import delay from 'delay'


const MESSAGE_TIMEOUT_MS = 1000 * 60 * 5
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

  protected _conversationMapper : Map<number, string> = new Map()

  protected _manager: FunctionManager = new FunctionManager()

  async load () {
    if (!config.api.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.api.enable) return
    const { email, password, pingMs, slaves } = config.api
    const { proxyServer, browserPath } = config
    this._api = new ChatGPTUnofficialProxyAPI({
      accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJhdWVuaHVrdXJhakBvdXRsb29rLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfSwiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS9hdXRoIjp7InVzZXJfaWQiOiJ1c2VyLTA2NE5kNEtIZnI1MXRrUjk0ZDlrVU9GViJ9LCJpc3MiOiJodHRwczovL2F1dGgwLm9wZW5haS5jb20vIiwic3ViIjoiYXV0aDB8NjNmM2I0ZjU5OWQ0ZTEyODQ3ZDNjMzdmIiwiYXVkIjpbImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEiLCJodHRwczovL29wZW5haS5vcGVuYWkuYXV0aDBhcHAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY3OTI3OTMzNiwiZXhwIjoxNjgwNDg4OTM2LCJhenAiOiJUZEpJY2JlMTZXb1RIdE45NW55eXdoNUU0eU9vNkl0RyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgbW9kZWwucmVhZCBtb2RlbC5yZXF1ZXN0IG9yZ2FuaXphdGlvbi5yZWFkIG9mZmxpbmVfYWNjZXNzIn0.aSYz5CWTN17TdfcKYU1mX-QWwjhaDNiJ1VZJm6p2GgCQozeqw-xTc8IDYAaIdoPNs0L5VtyJJnGMozX4mkVSTYuoZFj9noGJAyxhoVMV0I2cuU8SFGKrHYP5DyNOwHqBd4UDk_ivRBjH3dDapWRk7QddGdAjrIEXfpOcSIXkKlS-nZZEHKkptfGmV9BnNZCI5xooyVNZjwys1SfqI45oetZBAKyxKxgOejWIn1qs7fdLc7kpZByT4qx5Twcav-3uGpFiAcIGzF57eQJ2HZocIZVPglZXvasvG1HL4VB1UgTOr49SFHz_jPmH3hx1Gp0wpxK3gzG9j4hieTE19197wQ'
    })
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async reboot () {
    this.load()
  }

  push(uid: number, option: {
    conversationId?: string
    parentMessageId?: string
  }) {
    this._conversationMapper.set(uid, option)
  }

  delete(uid: number) {
    this._conversationMapper.delete(uid)
  }

  get(uid: number): {
    conversationId?: string
    parentMessageId?: string
  } {
    return this._conversationMapper.get(uid)
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
      const state: any = stateManager.getState(sender.id)
      state.chatApi = this._api

      // console.log('sendMessage', message)
      this._manager.push(this.buildExecutor(sender, message, async (res: ChatMessage) => onMessage(res, sender)))
    } catch (err) {
      await this.messageErrorHandler(sender, err)
    }
    
    this._iswait = false
    return false
  }

  buildExecutor(sender: Sender, message: QueueReply, onProgress: (r: ChatMessage) => Promise<void>) {
    return async (err?: Error) => {
      if (err) {
        this.messageErrorHandler(sender, err)
        return
      }

      const reply = async (
        str: string,
        onProgress?: (partialResponse: ChatMessage) => Promise<void>,
        timeoutMs: number = 500
      ): Promise<ChatMessage> => {
        const result = await this._api.sendMessage(str, {
          ... this.get(sender.id),
          onProgress
        })
        if (result.error) {
          return result
        }
        this.push(sender.id, {
          conversationId: result.conversationId,
          parentMessageId: result.id
        })
        if (onProgress) {
          await onProgress(result)
        }
        await delay(timeoutMs)
        return result
      }
      let result
      if (typeof message === 'string') {
        result = await reply(message, onProgress)
      } else {
        result = await message.call(undefined, reply, onProgress)
      }
      await onProgress({
        ...result,
        text: '[DONE]'
      })
    }
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
        cgptEmitChangeAccount()
      } catch(e: Error) {
        console.warn(
          `chatgpt error re-authenticating ${opts.email}`,
          err.toString()
        )
      }
      this._iswait = false

    } else if (err.statusCode === 403) {
      sender.reply('——————————————\nError: 403\n脑瓜子嗡嗡的, 让我缓缓 ...' + append, true)
    
    } else if (err.statusCode === 422) {
      // ignore error    
    } else if (err.message.includes('Not signed in')) {
      sender.reply(`发生错误\n${err} ${append}`)
      this.clash()

    } else {
      sender.reply(`发生错误\n${err} ${append}`)
    }
  }
}
