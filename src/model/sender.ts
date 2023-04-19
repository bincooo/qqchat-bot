import { preset, config } from 'src/config'
import getClient from 'src/core'
import * as types from 'src/types'
import stateManager from 'src/util/state'
import { nowAi } from 'src/util/config'

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

  protected _sessionId?: number


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
    if (!this._sessionId)
      this._sessionId = getClient().sessionId(this._event)
    return this._sessionId
  }

  get userId(): number {
    return this._userId
  }

  async reply(content: (types.TalkChain[] | string), quote?: boolean): [boolean, any] {
    return getClient().reply(this._event, (typeof content == 'string') ? [{ type: 'Plain', value: content }] : content, quote)
  }

  async recall(target: any): any {
    return await getClient().recall(target)
  }
}


export function buildTalkChain(sender: Sender, content: string): types.TalkChain {
  const state: any = stateManager.getState(sender.id)
  const ai = nowAi()
  const player =  preset.player?.find(item => item.key === state?.preset?.key && item.type.includes(ai))
  let resultMessage = content.trim()
  const chain: types.TalkChain = []
  if (resultMessage) {
    const regex = /\[@([0-9]{5,})\]/g
    const ats = resultMessage.match(regex) ?? []
    console.log('buildTalkChain ats:', ats)
    let pos = 0
    for (let index = 0, length = ats.length; index < length; index ++) {
      const at = ats[index]
      const onlineList = state?.preset?.onlineList ?? []
      // 存在在线列表中...
      const _at = at.substr(2, at.length - 3)
      const onlineSelf = onlineList.find(it => it.id == _at || it.name == _at)
      console.log('buildTalkChain online:', onlineList)
      if (onlineSelf) {
        const idx = resultMessage.indexOf(at, pos)
        if (idx >= 0) {
          const message = resultMessage.substr(pos, idx)
          if (message) {
            chain.push({ type: 'Plain', value: message })
          }
          chain.push({ type: 'At', value: onlineSelf.id })
          pos = idx + at.length
          console.log('buildTalkChain idx: ' + idx + ',  message: ' + message + ',  pos: ' + pos)
        }
      }
    }

    if (pos < resultMessage.length) {
      const message = resultMessage.substr(pos)
      chain.push({ type: 'Plain', value: message })
    }
  }

  return chain
}