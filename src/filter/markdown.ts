import { BaseMessageFilter } from 'src/types'
import { Sender } from 'src/model/sender'

export class MdFilter extends BaseMessageFilter {
  protected _isMd: boolean = false

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    const str = '```'
    if (!this._isMd && content.endsWith(str)) {
      this._isMd = true
      return [ false, content.substr(0, content.length - str.length) ]
    }

    if (this._isMd && content.endsWith(str)) {
      this._isMd = false
      return [ false, (str + content) ]
    }

    if (done) {
      this._isMd = false
      return [ false, (str + content + str) ]
    }

    return [ true, content.trim() ]
  }
}