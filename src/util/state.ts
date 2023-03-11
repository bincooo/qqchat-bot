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

  constructor() {
    this._globalTimer = setInterval(() => {
      Object.keys(this).forEach(uid => {
        const state = this[uid]
        if (state.isEnd) {
          this.recallLoading(uid)
        }
      })
    }, 1000)
  }

  getState(uid: number | string): any {
    if (!this[uid]) this[uid] = {}
    return this[uid]
  }

  setState(uid: number | string, data: any) {
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
    let identity
    const state = this.getState(uid)
    do {
      identity = state.loading?.shift()
      if(identity) {
        switch(config.type) {
          case "mirai":
            console.log('result2: ', identity)
            await getClient()?.api.recall(identity)
            break
          default:
            await getClient()?.deleteMsg(identity)
            break
        }
      }
    } while(!!identity)
  }

  sendLoading(
    sender: Sender,
    other?: {
      init: boolean
      isEnd: boolean
    }
  ) {
    const state = this.getState(sender.id)

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
      if (state.isEnd) {
        clearTimer()
        await this.recallLoading(sender.id)
        return
      }
      if (state.previousTs + 3000 < dat()) {
        clearTimer()
        let result
        switch(config.type) {
          case "mirai":
            result = await sender.reply([{
              type: 'Image',
              base64: this._gifB64
            }])
            console.log('result1: ', {messageId: result.messageId,
              target: sender.id})
            await this.recallLoading(sender.id)
            state.loading.push({
              messageId: result.messageId,
              target: sender.id
            })
            break
          default:
            result = await sender.reply(this._gif)
            await this.recallLoading(sender.id)
            state.loading.push(result.message_id)
            break
        }
      }
    }, 500)
  }
}

export default new GlobalStateManager()