import { ChatGPTAPIBrowser, ChatResponse } from 'cgpt'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import retryRequest from 'src/util/retry'
import { randomBytes } from 'crypto'

function genUid(): string {
  return 'uid-' + randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

export class ChatGPTHandler extends BaseMessageHandler {
  protected _api: ChatGPTAPIBrowser

  protected _uuid: string = genUid()
  
  protected _iswait: boolean = false

  async load () {
    if (!config.api.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.api.enable) return
    const { email, password, proxyServer, pingMs } = config.api
    this._api = new ChatGPTAPIBrowser({ email, password, proxyServer, heartbeatMs: pingMs })
    await this._api.initSession()
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async reboot () {
    this.load()
  }

  handle = async (sender: Sender) => {
    if (!config.api.enable) return true
    try {
      if (sender.textMessage === 'OpenTTS') {
        sender.reply('open the voice mode ~', false)
        config.tts = true
        return false
      }

      if (sender.textMessage === 'CloseTTS') {
        sender.reply('close the voice mode ~', false)
        config.tts = false
        return false
      } 

      if (sender.textMessage === 'reset') {
        this._iswait = false
        this._uuid = genUid()
        sender.reply('Previous conversation has been reset.', false)
        return false
      }

      if (this._iswait) {
        console.log('ignore message, is waiting ...')
        sender.reply('——————————————\nError: ignore\n脑瓜子嗡嗡的, 让我缓缓 ...', true)
        return false
      }

      this._iswait = true
      await this._api.queueSendMessage(filterTokens(sender.textMessage), {
        onProgress: (res) => {
          if (res.error) {
            this.messageErrorHandler(sender, res.error)
            return
          }
          onMessage(res, sender)
        }
      }, this._uuid)
    } catch (err) {
      this.messageErrorHandler(sender, err)
      logger.error(err)
    }
    
    this._iswait = false
    return false
  }

  messageErrorHandler (sender: Sender, err: any) {
    // if (err instanceof ChatGPTError) {
    if (err.message === 'ChatGPT invalid session token') {
      sender.reply('token 无效')
    } else if (err.statusCode === 5001) {
      sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ~', true)
    }  else if (err.statusCode === 403) {
      sender.reply('——————————————\nError: 403\n脑瓜子嗡嗡的, 让我缓缓 ...', true)
    } else if (err.message === 'ChatGPT failed to refresh auth token. TypeError: fetch failed') {
      sender.reply('——————————————\nError: unknown\nemmm... 脑子掉线啦, 可以再说一遍吗 ~', true)
    } else {
      sender.reply(`发生错误\n${err}`)
    }
  }
}
