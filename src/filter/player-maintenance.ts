import { BaseMessageFilter } from 'src/types'
import { preset } from 'src/config'
import stateManager from 'src/util/state'
import { Sender } from 'src/model/sender'
import { checkActingBehavior } from 'src/util/message'
import { nowAi } from 'src/util/config'

export class PlayerMaintenanceFilter extends BaseMessageFilter {
  
  protected _tmpMessages: Map<number, string[]> = new Map()

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    const state: any = stateManager.getState(sender.id)
    if (!!state.preset?.key) {
      const ai = nowAi()
      const player = preset.player.filter(item => item.key === state.preset.key && item.type.includes(ai))[0]
      const condition = checkActingBehavior(state, content)
      if (condition && !state.preset.maintenance) {
        state.preset.maintenance = !!condition
        if (!player.maintenance.warning) {
          sender.reply('system: warning(' + condition + ')\n———————\nAi觉醒了, 请重新编辑对话 ...', true)
          if (!!player && player.cache) {
            state.preset.cacheList = state.preset.cacheList.splice(0, state.preset.cacheList.length - 1)
          }
          return [ false, '' ]
        } else {
          state.preset.maintenanceCondition = condition
        }
      }

      if (!!player && player.cache) {
        if (!state.preset.maintenance) {
          this.cacheMessage(sender.id, content, state, !!done)
        } else {
          state.preset.cacheList = state.preset.cacheList.splice(0, state.preset.cacheList.length - 1)
        }
      }
    }

    return [ true, content ]
  }

  cacheMessage(senderId: number, message: string, state: any, done: boolean) {
    if (!this._tmpMessages.has(senderId)) {
      this._tmpMessages.set(senderId, [])
    }

    const tmpMsgs = this._tmpMessages.get(senderId)
    tmpMsgs.push(message)
    
    if (!state.preset.maintenance && done) {
      state.preset.cacheList.push(tmpMsgs.join(''))
    }

    if (done) {
      this._tmpMessages.delete(senderId)
    }
  }
}