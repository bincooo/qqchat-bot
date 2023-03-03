import { BaseMessageFilter } from 'src/types'
import { preset } from 'src/config'

export class PlayerMaintenanceFilter extends BaseMessageFilter {
  
  protected _haveResistance: boolean = false

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, , sender?: Sender, done?: boolean) => {
    if (!!preset.active) {
      const player = preset.player.filter(item => item.key === preset.active)[0]
      if (!!player && !!player.maintenance) {
        const condition = (player.maintenance.condition??[])
          .find(item => content.indexOf(item) >= 0)
        if (condition) {
          this._haveResistance = condition
        }

        if (this._haveResistance && done) {
          preset.maintenance = true
          this._haveResistance = false
        }
      }
    }
    return [ true, content ]
  }
}