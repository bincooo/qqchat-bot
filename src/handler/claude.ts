import Authenticator from 'claude-api'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler, ChatMessage, type QueueReply } from 'src/types'
import logger from 'src/util/log'
import { filterTokens, onMessage } from 'src/util/message'
import stateManager from 'src/util/state'
import { randomBytes } from 'crypto'
import { GroupFunctionManager } from 'src/util/queue'
import delay from 'delay'
import getClient from 'src/core'
import { aiEmitResetSession } from 'src/util/event'

function genUid(): string {
  return 'uid-' + randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

function dat(): number {
  return new Date()
    .getTime()
}



export class ClaudeHandler extends BaseMessageHandler {
  protected _bot?: Authenticator
  protected _channel?: string
  protected _conversationMapper = new Map<number, string>()
  protected _manager: FunctionManager = new GroupFunctionManager()
  protected _iswait: boolean = false


  async load() {
    if (!config.Claude.enable) return
    await this.initClaude()
  }

  async initClaude() {
    const {
      bot,
      token
    } = config.Claude
    this._bot = new Authenticator(token, bot, true)
  }

  async reboot () {
    this.load()
  }

  destroy(uid: number) {
    if (this._conversationMapper.has(uid)) {
      this._conversationMapper.delete(uid)
    }
  }

  handle = async (sender: Sender) => {
    if (!config.Claude.enable) return true

    if (this._iswait) {
      console.log('ignore message, is waiting ...')
      sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ~', true)
      return false
    }
    try {

      if (sender.textMessage?.trim() === '!reset') {
        this.destroy(sender.id)
        sender.reply('当前会话已重置 ~')
        aiEmitResetSession(sender.id)
        return false
      }

      const message = await filterTokens(sender.textMessage, sender)
      if (!message) {
        return false
      }

      this._iswait = true

      stateManager.sendLoading(sender, { init: true, isEnd: false })
      if (!this._channel) {
        this._channel = await this._bot.newChannel('chat-7890')
      }
      
      this._manager.push(sender.id, this.buildExecutor(sender, message, (res: ChatMessage) => { onMessage(res, sender) }))
    } catch(err) {
      this.messageErrorHandler(sender, err)
    }

    this._iswait = false
    return true
  }


  buildExecutor(sender: Sender, message: QueueReply, onProgress: (r: ChatMessage) => void) {
    return async (err?: Error) => {
      if (err) {
        this.messageErrorHandler(sender, err)
        return
      }

      const reply = async (
        str: string,
        on?: (partialResponse: ChatMessage) => void,
        timeoutMs: number = 500
      ): Promise<ChatMessage> => {

        const result: ChatMessage = await this._bot.sendMessage({
          text: str,
          channel: this._channel,
          conversationId: this._conversationMapper.get(sender.id),
          onMessage: on
        })

        if (result.error) {
          return result
        }
        
        this._conversationMapper.set(sender.id, result.conversationId)
        if (on) {
          await on({ ...result, text: '[DONE]' })
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
        console.log('chatgpt web 1 ======>>>>>', result)
      }
    }
  }


  async messageErrorHandler(sender: Sender, err: Error) {
    stateManager.sendLoading(sender, { init: true, isEnd: true })
    if (err.statusCode === 5001) {
      sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ...', true)
    } else {
      sender.reply(`发生错误\n${err}`)
    }
  }
}
