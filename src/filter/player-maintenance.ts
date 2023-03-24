import { BaseMessageFilter } from 'src/types'
import { preset } from 'src/config'
import stateManager from 'src/util/state'
import { Sender } from 'src/model/sender'

export class PlayerMaintenanceFilter extends BaseMessageFilter {
  
  protected _tmpMessages: Map<number, string[]> = new Map()

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    const state: any = stateManager.getState(sender.id)
    if (!!state.preset?.key) {
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player && !!player.maintenance) {
        const condition = (player.maintenance.condition??[])
          .find(item => content.indexOf(item) >= 0)
        if (condition) {
          state.preset.maintenance = !!condition
          state.preset.maintenanceCondition = condition
        }
      }
    }
    
    this.cacheMessage(sender.id, content, state, !!done)
    return [ true, content ]
  }

  cacheMessage(senderId: number, message: string, state: any, done: boolean) {
    if (!this._tmpMessages.has(senderId)) {
      this._tmpMessages.set(senderId, [])
    }

    const tmpMsgs = this._tmpMessages.get(senderId)
    tmpMsgs.push(content)
    
    if (!state.preset.maintenance && done) {
      state.preset.cacheList.push(tmpMsgs.join(''))
    }

    if (done) {
      this._tmpMessages.delete(senderId)
    }
  }
}