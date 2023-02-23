import { config } from 'src/config'
import { MessageEvent } from 'src/types'
import { GuildMessage } from 'oicq-guild/lib/message'
import { Sendable } from 'oicq'

import { getClient } from 'src/core/oicq'

/**
 * 消息对象的封装
 */
export class Sender {
  public isAdmin: boolean

  /**
   * 文本信息（不含@）
   */
  public textMessage: string

  protected _eventObject: MessageEvent

  public userId: number

  constructor (e: MessageEvent) {
    this._eventObject = e
    this.textMessage = e.message?.filter(item => item.type === 'text').map(item => item.text).join().trim()
    if (!e.atme && !!config.botNickname) {
      this.textMessage = this.textMessage?.replaceAll('@' + config.botNickname, '')?.trim()
    }
    if (!(e instanceof GuildMessage)) {
      this.userId = e.sender?.user_id || e.user_id
      this.isAdmin = this.userId === Number(config.adminQQ)
    }
  }

  getEventObject(): MessageEvent {
    return this._eventObject
  }

  async reply(content: Sendable, quote?: boolean): any {
    return await this._eventObject.reply(content, quote)
  }

  async recallMsg(id: string): any {
    return await getClient()?.deleteMsg(id)
  }
}
