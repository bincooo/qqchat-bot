import { ChatGPTAPIBrowser, ChatResponse } from 'cgpt'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import retryRequest from 'src/util/retry'

export class ChatGPTHandler extends BaseMessageHandler {
  protected _api: ChatGPTAPIBrowser

  protected _trackSession: ChatResponse

  protected _conversationMap: Map = new Map()
  protected _isWait: boolean = false

  async load () {
    if (!config.api.enable) return
    await this.initChatGPT()
  }

  async initChatGPT () {
    if (!config.api.enable) return
    const { email, password, proxyServer } = config.api
    this._api = new ChatGPTAPIBrowser({ email, password, proxyServer, userDataDir: '/bot/data/' + email })
    await this._api.initSession()
    console.log('chatgpt - execute initChatGPT method success.')
  }

  async getConversation() {
    if (this._trackSession?.conversationId) {
      return this._trackSession?.conversationId
    }
    const res = await this._api.sendMessage('嗨')
    this._trackSession = res
    return res.conversationId
  }

  async reboot () {
    this.load()
  }

  handle = async (sender: Sender) => {
    if (!config.api.enable) return true
    try {

      this._conversationMap.set(await this.getConversation(), sender)
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
        this._isWait = false
        this._trackSession = null
        sender.reply('Previous conversation has been reset.', false)
        return false
      }

      if (this._isWait) {
        console.log('ignore message, is waiting ...')
        sender.reply('问的太快啦,让我先想想~', true)
        return false
      }

      this._isWait = true
      const response = await retryRequest(() =>
        this._api.sendMessage(filterTokens(sender.textMessage), {
          conversationId: this._trackSession?.conversationId,
          parentMessageId: this._trackSession?.messageId,
          onProgress: (res) => {
            onMessage(res, sender)
          }
        }),
        3,
        500
      )

      onMessage({...response, response: '[DONE]'}, sender)
      this._trackSession = response
      // sender.reply(this._trackSession.response, true)
    } catch (err) {
      this.messageErrorHandler(sender, err)
      logger.error(err)
    }
    
    this._isWait = false
    return false
  }

  messageErrorHandler (sender: Sender, err: any) {
    // if (err instanceof ChatGPTError) {
    if (err.message === 'ChatGPT invalid session token') {
      sender.reply('token 无效')
    } else if (err.message === 'ChatGPT failed to refresh auth token. Error: session token may have expired') {
      sender.reply('token 过期，请使用/token set 重新设置token')
    } else if (err.message === 'ChatGPT failed to refresh auth token. TypeError: fetch failed') {
      // （后续加个配置文件自己处理错误消息吧
      sender.reply('emmm... 脑子掉线啦，可以再说一遍吗~~')
    } else if (err.message === 'ChatGPT timed out waiting for response') {
      sender.reply('连接超时，请稍后再试~')
    } else if (err.message === 'ChatGPTAPI error 429') {
      sender.reply('问的太快啦，让我先想想!')
    } else {
      sender.reply(`发生错误\n${err}`)
    }
  }
}
