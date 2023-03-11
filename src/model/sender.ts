import { config } from 'src/config'
import { MessageEvent, MiraiBasicEvent } from 'src/types'
import { GuildMessage } from 'oicq-guild/lib/message'
import { Sendable } from 'oicq'
import getClient from 'src/core'

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

  public isMirai: boolean = false

  constructor (e: MessageEvent) {
    this.isMirai = !!e.mirai
    // mirai
    if (config.type === 'mirai') {
      this._eventObject = e
      this.textMessage = e.messageChain.filter(item => item.type === 'Plain').map(item => item.text).join().trim()
      this.isGroup = (e.type === 'GroupMessage')
      if (!(e.isAt && e.isAt()) && !!config.botNickname) {
        this.textMessage = this.textMessage?.replaceAll('@' + config.botNickname, '')?.trim()
      }
      this.userId = e.sender.id
      this.nickname = e.sender.memberName
      this.isAdmin = this.userId === Number(config.adminQQ)
      return
    }

    // oicq
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
    switch (config.type) {
      case "mirai":
        return this.isGroup ?
          this._eventObject.group.id :
          this.userId
      default:
        return this.isGroup ? 
          this._eventObject.group_id??this._eventObject.group.group_id :
          this.userId
    }
  }

  async reply(content: (Sendable | (any)[]), quote?: boolean): any {
    return await this._eventObject.reply(content, quote)
  }

  async recallMsg(identity: any): any {
    switch(config.type) {
      case "mirai":
        return await getClient()?.api.recall(identity)
      default:
        return await getClient()?.deleteMsg(identity)
    }
  }
}
