import fs from 'fs'
import { segment, Sendable } from 'oicq'
import { Sender } from 'src/model/sender'
import getClient from 'src/core'
import { config } from 'src/config'


function dat(): number {
  return new Date()
    .getTime()
}

class GlobalStateManager {

  protected _gif: Sendable = segment.image('./loading.gif')
  protected _gifB64: string = fs.readFileSync('./loading.gif').toString('base64')
  protected _globalTimer: NodeJS.Timer
  protected _ids: Array<(number | string)> = []

  constructor() {
    this._globalTimer = setInterval(() => {
      this._ids.forEach(uid => {
        const state = this[uid]
        if (config.debug)
            console.log('GlobalStateManager_globalTimer['+uid+']', state)
        if (state?.isEnd) {
          this.recallLoading(uid)
        }
      })
    }, 3200)
  }

  getState(uid: number | string): any {
    if (!this[uid]) this[uid] = {}
    return this[uid]
  }

  getIds(): Array<(number | string)> {
    return this._ids
  }

  setState(uid: number | string, data: any) {
    this._ids.push(uid)
    this[uid] = data
  }

  setIsEnd(sender: Sender, isEnd: boolean) {
    const state = this.getState(sender.id)
    state.isEnd = isEnd
    if (isEnd) {
      state.previousTs = dat() + 60 * 1000
      return
    }
    state.previousTs = dat()
  }

  async recallLoading(uid: number | string) {
    let target
    const state = this.getState(uid)
    do {
      target = state.loading?.shift()
      if(target) {
        if (config.debug) {
          console.log('state.recallLoading ====>>> ', target)
        }
        try {
          await getClient().recall(target)
        } catch(err) {
          console.log('recall loading error:', err)
        }
      }
    } while(!!target)
  }

  sendLoading(
    sender: Sender,
    other?: {
      init: boolean
      isEnd: boolean
    }
  ) {
    let state = this.getState(sender.id)

    if (other?.init) {
      this.setIsEnd(sender, other.isEnd)
    }

    const clearTimer = () => {
      if (state.timer) {
        clearInterval(state.timer)
        state.timer = null
      }
    }

    if (!state.loading) {
      state.loading = []
    }

    clearTimer()
    state.timer = setInterval(async () => {
      state = this.getState(sender.id)
      if (state.isEnd) {
        clearTimer()
        await this.recallLoading(sender.id)
        return
      }
      if (state.previousTs + 3000 < dat()) {
        clearTimer()
        if (state.isEnd) {
          this.setIsEnd(sender, true)
          return
        }

        const [ok, result] = await sender.reply([{ type: 'Image', value: this._gifB64 }])
        await this.recallLoading(sender.id)
        if (!ok) return
        state.loading.push(result)
      }
    }, 500)
  }
}

export default new GlobalStateManager()