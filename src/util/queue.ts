import delay from 'delay'
import { ChatGPTError } from 'chatgpt'
const TIMEOUT_MS = 500

export default class FunctionManager {
  protected _maximum: number
  public array: Array<(error?: Error) => void>
  protected _timer: NodeJS.Timer | null = null

  constructor(maximum: number = 3) {
    this._maximum = maximum
    this.array = []

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
    const len = this.array.length
    if (len >= this._maximum) {
      const error = new ChatGPTError('queue maximum is full: ' + len)
      error.statusCode = 5001
      error.statusText = 'Error 5001'
      throw error
    }
    this.array.push(element)
  }

  private shift(): (error?: Error) => void {
    return this.array.shift()
  }

}


export class GroupFunctionManager {
  protected _manager = new Map<number, FunctionManager>()
  protected _maximum?: number

  constructor(maximum: number = 3) {
    this._maximum = maximum
  }

  async push(uid: number, element: (error?: Error) => void) {
    if (!element) {
      return
    }
    let manager = this._manager.get(uid)
    if (!manager) {
      manager = new FunctionManager(this._maximum)
      this._manager.set(uid, manager)
    }
    await manager.push(element)
  }
}