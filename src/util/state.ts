

class GlobalStateManager {

  constructor() {}

  getState(uid: number): any {
    if (!this[uid]) this[uid] = {}
    return this[uid]
  }

  setState(uid, data: any) {
    this[uid] = data
  }
}

export default new GlobalStateManager()