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

  public group?: any

  public isMirai: boolean = false

  constructor (e: MessageEvent) {
    this.isMirai = !!e.mirai
    // mirai
    if (config.type === 'mirai') {
      this._eventObject = e
      this.textMessage = e.messageChain?.filter(item => item.type === 'Plain').map(item => item.text).join().trim()
      this.group = (e.type === 'GroupMessage' ? e.sender.group : undefined)
      if (!(e.isAt && e.isAt()) && !!config.botNickname) {
        this.textMessage = this.textMessage?.replaceAll('@' + config.botNickname, '')?.trim()
      }
      this.userId = e.sender?.id??e.member.id
      this.nickname = e.sender?.memberName??e.sender?.nickname
      this.isAdmin = this.userId === Number(config.adminQQ)
      return
    }

    // oicq
    this._eventObject = e
    this.textMessage = e.message?.filter(item => item.type === 'text').map(item => item.text).join().trim()
    this.group = e.group
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
    let result = undefined
    switch (config.type) {
      case "mirai":
        result = this.group ? this.group.id : this.userId
        break
      default:
        result = this.group ? this.group.group_id : this.userId
        break
    }
    return result
  }

  async reply(content: (Sendable | (any)[]), quote?: boolean): any {
    let result = await this._eventObject.reply(content, quote)
    if (config.debug) {
      console.log('sender reply result: ', result)
    }
    let count = 3
    while ((count > 0 && result.code == 500)) {
      count--
      result = await this._eventObject.reply(content, quote)
      if (config.debug) {
        console.log('reply result code[500], retry ' + (3 - count) + ' ...', content, result)
      }
    }
    if(result.code == 500) {
      console.log('retry fail, use `sendGroupMessage` method: ', 
        this._eventObject.messageChain)
      if(!!this.group) {
        const chain = (this._eventObject.messageChain?[]).filter(item => ['At', 'Plain'].includes(item.type))
        if (chain[0]) {
          result = await getClient()?.api.sendGroupMessage(content, this.id, chain[0]?.id)
        }
      } else if (e.type === 'TempMessage') {
        result = await getClient()?.api.sendTempMessage(content, this.id)
      } else{
        result = await getClient()?.api.sendFriendMessage(content, this.id)
      }
    }
    return result
  }

  async recallMsg(identity: any): any {
    if (config.debug) {
      console.log('sender recall message: ', identity)
    }
    switch(config.type) {
      case "mirai":
        return await getClient()?.api.recall(identity)
      default:
        return await getClient()?.deleteMsg(identity)
    }
  }
}
