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
import { openAIAuth } from 'src/util/request'
import { loadConfig, writeConfig } from 'src/util/config'
import schedule from 'node-schedule'
import delay from 'delay'


const MESSAGE_TIMEOUT_MS = 1000 * 60 * 5
let countNotSigned = 0
// let count429 = 0

function genUid(): string {
  return 'uid-' + randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

function dat(): number {
  return new Date()
    .getTime()
}

declare type Email = {
  email: string
  password: string
  accessToken?: string
  session?: Map<number, {
    conversationId?: string
    parentMessageId?: string
  }>
}

class EmailPool {
  protected _pool: Array<Email>
  protected _currentIndex: number = -1

  constructor(
    pool: Array<Email>
  ) {

    this._pool = pool.map(it => {
      it.session = new Map()
      return it
    })
    console.log('email pool:', pool.map(it => {
      return {
        email: it.email ?? 'null',
        password: it.password ? it.password.substr(0, 1) + '***' + it.password.substr(it.password.length - 2) : 'null',
        expires: it.expires ?? -1,
        accessToken: it.accessToken ? (it.accessToken.substr(0, 50) ?? '???') + ' ...' : 'null'
      }
    }))
    this.scheduleJob()
  }

  scheduleJob() {
    schedule.scheduleJob('obtain-accessToken-job', '30 0 4 * * *', async () => {
      let needSave = false
      for(let index = 0, length = this._pool.length; index < length; index ++) {
        const it = this._pool[index]
        if (!it.expires) {
          continue
        }

        if (it.expires < dat()) {
          const accessToken = await login(it.email, it.password)
          if (accessToken) {
            // 存留28天
            it.expires = dat() + 1000 * 120 * 12 * 28
            it.accessToken = accessToken
            needSave = true
          }
        }
      }
      if (needSave) {
        saveConfig(this._pool)
      }
    })
  }

  next(): string {
    const size = this._pool.length
    this._currentIndex ++
    if (this._currentIndex >= size)
      this._currentIndex = 0
    return this._pool[this._currentIndex]
  }

  getArgs(uid: number): {
    conversationId?: string
    parentMessageId?: string
  } {
    const account = this._pool[this._currentIndex]
    return account.session.get(uid) ?? {}
  }

  setArgs(uid: number, args: {
    conversationId?: string
    parentMessageId?: string
  }) {
    const account = this._pool[this._currentIndex]
    account.session.set(uid, args)
  }

  delArgs(uid: number) {
    const account = this._pool[this._currentIndex]
    account.delete(uid)
  }
}

async function login(email: string, passwd: string) {
  try {
    console.log('[' + email + '] Begin obtain accessToken ...')
    const result = await openAIAuth(email, passwd)
    if (result.statusCode !== 200) {
      console.log(`[${email}] Failed to obtain accessToken ===>>>`, result)
    } else {
      console.log('['+ email +'] Succeeded in obtaining `accessToken`!')
      return result.data
    }
  } catch(err) {
    console.log(`[${email}] Failed to obtain accessToken ===>>>`, err)
  }
  return null
}

async function saveConfig(pool: Array<Email>) {
  const configFile = process.cwd() + '/conf/config.json'
  const jsonObject = await loadConfig(configFile)
  if (jsonObject?.api?.account) {
    jsonObject.api.account = pool.map(it => {
      const result = {...it}
      delete result.session
      return result
    })
    await writeConfig(jsonObject)
  }
}


export class ChatGPTHandler extends BaseMessageHandler {
  protected _api: ChatGPTAPIBrowser

  protected _iswait: boolean = false

  protected _emailPool: EmailPool

  protected _conversationMapper : Map<number, string> = new Map()

  protected _manager: FunctionManager = new FunctionManager()

  async load () {
    if (!config.openaiWebAPI.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.openaiWebAPI.enable) return
    const { endpoint, account } = config.openaiWebAPI
    let needSave = false
    for(let index = 0, length = account.length; index < length; index ++) {
      const it = account[index]
      if (it.accessToken) {
        continue
      }
      const accessToken = await login(it.email, it.password)
      if (accessToken) {
        // 存留28天
        it.expires = dat() + 1000 * 120 * 12 * 28
        it.accessToken = accessToken
        needSave = true
      }
    }
    if (needSave) {
      await saveConfig(account)
    }

    this._emailPool = new EmailPool([...account])
    const { accessToken } = this._emailPool.next()
    this._api = new ChatGPTUnofficialProxyAPI({
      apiReverseProxyUrl: endpoint.conversation,
      accessToken
    })
    config.chatApi = this._api
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async reboot () {
    this.load()
  }

  handle = async (sender: Sender) => {
    if (!config.openaiWebAPI.enable) return true
    try {

      if (sender.textMessage?.trim() === '!reset') {
        this._emailPool.setArgs(sender.id, {})
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
          ... this._emailPool.getArgs(sender.id),
          onProgress
        })
        if (result.error) {
          return result
        }
        this._emailPool.setArgs(sender.id, {
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
      if (config.debug) {
        console.log('chatgpt web ======>>>>>', result)
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
      this._emailPool.next()

    } else if (err.statusCode === 403) {
      sender.reply('——————————————\nError: 403\n脑瓜子嗡嗡的, 让我缓缓 ...' + append, true)
    
    } else if (err.statusCode === 422) {
      // ignore error
    } else if (err.message?.includes('Not signed in')) {
      sender.reply(`发生错误\n${err} ${append}`)

    } else {
      sender.reply(`发生错误\n${err} ${append}`)
    }
  }
}
