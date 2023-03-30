import { config } from 'src/config'
import { GuildMessage } from 'oicq-guild/lib/message'
import { md2jpg, genTemplate } from 'src/util/browser'
import delay from 'delay'
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

  protected _event: any

  public nickname: string

  public group?: any


  constructor (e: any) {
    const info = getClient().information(e)
    this.isAdmin = info.isAdmin
    this.group = info.group
    this.nickname = info.nickname
    this.textMessage = info.textMessage
    this._event = e
  }

  getEvent(): any {
    return this._event
  }

  get id(): number {
    return getClient().sessionId(this._event)
  }

  async reply(content: (TalkChain[] | string), quote?: boolean): [boolean, any] {
    return getClient().reply(this._event, (typeof content == 'string') ? [{ type: 'Plain', value: content }] : content, quote)
  }

  async recall(target: any): any {
    return await getClient().recall(target)
  }
}
