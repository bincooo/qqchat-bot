import delay from 'delay'
import type * as types from 'chatgpt'
const TIMEOUT_MS = 500

export default class FunctionManager {
  protected _maximum: number
  protected _array: Array<(error?: Error) => void>
  protected _timer: NodeJS.Timer | null = null

  constructor(maximum: number = 3) {
    this._maximum = maximum
    this._array = []

    let inProgress = false
    this._timer = setInterval(async () => {
      if (inProgress) return
      inProgress = true

      const actuator = this.shift()
      if (!actuator) {
        inProgress = false
        return
      }

      try {
        await actuator.call(undefined)
      } catch(err) {
        try {
          await actuator.call(undefined, err)
        } catch(e) {}
      }

      await delay(800)
      inProgress = false
    }, TIMEOUT_MS)
  }

  async push(element: (error?: Error) => void) {
    if (!element) {
      return
    }
    const len = this._array.length
    if (len >= this._maximum) {
      const error = new types.ChatGPTError('queue maximum is full: ' + len)
      error.statusCode = 5001
      error.statusText = 'Error 5001'
      throw error
    }
    this._array.push(element)
  }

  shift(): (error?: Error) => void {
    return this._array.shift()
  }

}