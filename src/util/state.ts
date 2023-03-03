
function dat(): number {
  return new Date()
    .getTime()
}

class GlobalStateManager {

  protected _gif: Sendable = segment.image('./loading.gif')
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
    state.previousTs = 
    if (isEnd) {
      state.previousTs = dat() + 60 * 1000
      return
    }
    state.previousTs = dat()
  }

  async recallLoading(uid: number | string) {
    let messageId
    const state = this.getState(uid)
    do {
      messageId = state.loading?.shift()
      if(messageId) {
        const result = await getClient()?.deleteMsg(messageId)
      }
    } while(!!messageId)
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

    const clear = (timer: NodeJS.Timer) => {
      if (timer) {
        clearInterval(timer)
      }
    }

    clear(state.timer)
    state.timer = setInterval(async () => {
      if (state.isEnd) {
        clear(state.timer)
        await this.recallLoading(sender.id)
        return
      }
      if (state.previousTs + 2500 < dat()) {
        const result = await sender.reply(this._gif)
        await this.recallLoading(sender.id)
        state.loading.push(result.message_id)
        clear(state.timer)
      }
    }, 500)
  }
}

export default new GlobalStateManager()