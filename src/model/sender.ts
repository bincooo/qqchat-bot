import { config } from 'src/config'
import { MessageEvent } from 'src/types'
import { GuildMessage } from 'oicq-guild/lib/message'
import { Sendable } from 'oicq'

/**
 * 消息对象的封装
 */
export class Sender {
  isAdmin: boolean

  /**
   * 文本信息（不含@）
   */
  textMessage: string

  _eventObject: MessageEvent

  userID: number

  constructor (e: MessageEvent) {
    this._eventObject = e
    this.textMessage = e.message.filter(item => item.type === 'text').map(item => item.text).join().trim()
    if (!(e instanceof GuildMessage)) {
      this.userID = e.sender.user_id
      this.isAdmin = e.sender.user_id === Number(config.adminQQ)
    }
  }

  async reply (content: Sendable, quote?: boolean): any {
    return await this._eventObject.reply(content, quote)
  }

  async recallMsg(id: string): any {
    return await config.client.deleteMsg(id)
  }
}
