import Authenticator from 'claude-api'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseAiHandler, type ChatMessage, type MsgCaller } from 'src/types'
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



export class ClaudeHandler extends BaseAiHandler<Authenticator> {
  protected _channel?: string
  protected _conversationMapper = new Map<number, string>()
  protected _manager: FunctionManager = new GroupFunctionManager()
  protected _iswait: boolean = false


  override async load() {
    if (!config.Claude.enable) return
    const {
      bot,
      token
    } = config.Claude
    this.setApi(new Authenticator(token, bot))
  }


  destroy(uid: number) {
    if (this._conversationMapper.has(uid)) {
      this._conversationMapper.delete(uid)
    }
  }


  override enquire = async (sender: Sender) => {
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
        this._channel = await this.getApi().newChannel('chat-' + config.botQQ)
      }
      
      await this._manager.push(sender.id, this.build(sender, message, {
        do: (...args) => this.reply(sender, ...args),
        on: (res: ChatMessage) => {
          onMessage(res, sender)
        }
      }))
    } catch(err) {
      this.messageErrorHandler(sender, err)
    }

    this._iswait = false
    return true
  }


  private async reply(
    sender: Sender,
    prompt: string,
    on?: (partialResponse: ChatMessage) => void,
    timeoutMs: number = 500
  ): Promise<ChatMessage> {
    const result: ChatMessage = await this.getApi().sendMessage({
      text: prompt,
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


  override async messageErrorHandler(sender: Sender, err: Error) {
    stateManager.sendLoading(sender, { init: true, isEnd: true })
    if (err.statusCode === 5001) {
      sender.reply('——————————————\nError: 5001\n讲的太快了, 休息一下吧 ...', true)
    } else {
      sender.reply(`发生错误\n${err}`)
    }
  }
}
