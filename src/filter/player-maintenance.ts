import { BaseMessageFilter } from 'src/types'
import { preset } from 'src/config'
import stateManager from 'src/util/state'

export class PlayerMaintenanceFilter extends BaseMessageFilter {
  
  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    if (!!state.preset?.key) {
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player && !!player.maintenance) {
        const condition = (player.maintenance.condition??[])
          .find(item => content.indexOf(item) >= 0)
        if (condition) {
          state.preset.maintenance = !!condition
        }
      }
    }
    return [ true, content ]
  }
}