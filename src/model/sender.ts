import { config } from 'src/config'
import { GuildMessage } from 'oicq-guild/lib/message'
import { md2jpg, genTemplate } from 'src/util/browser'
import delay from 'delay'
import { Sendable } from 'oicq'
import getClient from 'src/core'
import stateManager from 'src/util/state'

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

  protected _userId?: number


  constructor (e: any) {
    this._event = e
    stateManager.getState(this.id)
    const info = getClient().information(e)
    this.group = info.group
    this.isAdmin = info.isAdmin
    this.nickname = info.nickname
    this.textMessage = info.textMessage
    this._userId = info.userId
  }

  getEvent(): any {
    return this._event
  }

  get id(): number {
    return getClient().sessionId(this._event)
  }

  get userId(): number {
    return this._userId
  }

  async reply(content: (TalkChain[] | string), quote?: boolean): [boolean, any] {
    return getClient().reply(this._event, (typeof content == 'string') ? [{ type: 'Plain', value: content }] : content, quote)
  }

  async recall(target: any): any {
    return await getClient().recall(target)
  }
}
