import { BaseMessageFilter } from 'src/types'
import { Sender } from 'src/model/sender'


const str = '```'

export class MdFilter extends BaseMessageFilter {
  protected _matchMarkdown: boolean = false

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    let index = 0
    const methods = [ 'assert_one', 'assert_two', 'assert_three' ]
    while(index < methods.length) {
      const [ match, result ] = this[methods[index]].call(this, content, done)
      if (match) {
        return [ false, result ]
      }
      index++
    }
    return [ true, content ]
  }

  /**
   * is markdown start block
   */
  assert_one(content: string, done: boolean): (boolean | string)[] {
    const match = (!this._matchMarkdown && content.endsWith(str))
    if (match) {
      this._matchMarkdown = true
      const result = content.substr(0, content.length - str.length)
      return [ true, result ]
    }
    return [ false, content ]
  }

  /**
   * is markdown end block
   */
  assert_two(content: string, done: boolean): boolean {
    const match = (this._matchMarkdown && content.endsWith(str))
    if (match) {
      this._matchMarkdown = false
      const result = [ str, content, str ].join('')
      return [ true, result ]
    }
    return [ false, content ]
  }

  /**
   * unknown
   */
  assert_three(content: string, done: boolean) {
    if (done) {
      if (this._matchMarkdown) {
        this._matchMarkdown = false
        const result = [ str, content, str ].join('')
        return [ true, result ]
      }
    }
    return [ false, content ]
  }
}