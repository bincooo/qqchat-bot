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

  public nickname: string

  public isGroup: boolean = false

  constructor (e: MessageEvent) {
    this._eventObject = e
    this.textMessage = e.message?.filter(item => item.type === 'text').map(item => item.text).join().trim()
    this.isGroup = (!!e.group)
    if (!e.atme && !!config.botNickname) {
      this.textMessage = this.textMessage?.replaceAll('@' + config.botNickname, '')?.trim()
    }
    if (!(e instanceof GuildMessage)) {
      this.userId = e.sender?.user_id || e.user_id
      this.nickname = e.sender?.nickname || e.nickname
      this.isAdmin = this.userId === Number(config.adminQQ)
    }
  }

  getEventObject(): MessageEvent {
    return this._eventObject
  }

  get id(): number {
    return this.isGroup ? 
      this._eventObject.group_id??this._eventObject.group.group_id :
      this.userId
  }

  async reply(content: Sendable, quote?: boolean): any {
    return await this._eventObject.reply(content, quote)
  }

  async recallMsg(id: string): any {
    return await getClient()?.deleteMsg(id)
  }
}
