import { BaseMessageFilter } from 'src/types'
import { Sender } from 'src/model/sender'
import { segment } from 'oicq'
import { md2jpg, genTemplate } from 'src/util/browser'
import { config } from 'src/config'
import { shortURL } from 'src/util/request'

const str = '```'

export class MdFilter extends BaseMessageFilter {
  protected _isMarkdown: boolean = false
  protected _isCode: boolean = false
  protected _messageContiner: Array<string> = []
  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    if (!!content) [ true, content ]

    let index = 0
    const methods = [
      'assert_one',
      'assert_two',
      'assert_three',
      'assert_four',
      'assert_five'
    ]
    while(index < methods.length) {
      const [ match, result ] = await (this[methods[index]].call(this, content, sender, done))
      if (match) {
        return [ false, result ]
      }
      index++
    }
    return [ true, content ]
  }

  async assert_one(content: string, sender?: Sender, done: boolean): (boolean | string)[] {
    if (config.debug) {
      console.log('markdown =====> [' + done + ']')
    }

    const doit = async () => {
      if (config.debug) {
        console.log('_messageContiner', this._messageContiner.join('\n'))
      }
      await this.__md2jpg(sender, this._messageContiner.join('\n'))
      this._messageContiner = []
      return [ true, '' ]
    }

    if (content?.trim().startsWith('[markdown]')) {
      this._isMarkdown = true
      this._messageContiner = []
      this._messageContiner.push(content?.trim().substr(10))
      if (done) {
        return await doit()
      }
      return [ true, '' ]
    }

    if (this._isMarkdown) {
      this._messageContiner.push(content)
      if (done) {
        this._isMarkdown = false
        return await doit()
      }
      return [ true, '' ]
    }

    return [ false, content ]
  }

  /**
   * is markdown start block
   */
  async assert_two(content: string, sender?: Sender, done: boolean): (boolean | string)[] {
    const match = (!this._isCode && content.endsWith(str))
    if (match) {
      this._isCode = true
      this._messageContiner = []
      const result = content.substr(0, content.length - str.length)
      return [ true, result ]
    }
    return [ false, content ]
  }

  /**
   * is markdown end block
   */
  async assert_three(content: string, sender?: Sender, done: boolean): boolean {
    const match = (this._isCode && content.endsWith(str))
    if (match) {
      this._isCode = false
      this._messageContiner.push(content)
      if (config.debug) {
        console.log('_messageContiner', this._messageContiner.join('\n'))
      }
      await this.__md2jpg(sender, [ str, this._messageContiner.join('\n') ].join(''))
      return [ true, '' ]
    }
    return [ false, content ]
  }

  /**
   * unknown
   */
  async assert_four(content: string, sender?: Sender, done: boolean) {
    if (done) {
      if (this._isCode) {
        this._isCode = false
        this._messageContiner.push(content)
        if (config.debug) {
          console.log('_messageContiner', this._messageContiner.join('\n'))
        }
        await this.__md2jpg(sender, [ str, this._messageContiner.join('\n'), '\n', str ].join(''))
        return [ true, '' ]
      }
      this._isCode = false
    }
    return [ false, content ]
  }

  /**
   * message Container
   */
  assert_five(content: string, done: boolean) {
    if (this._isCode) {
      this._messageContiner.push(content)
      return [ true, '' ]
    }
    return [ false, content ]
  }


  async __md2jpg(sender: Sender, content: string) {
    const b = '```markdown'
    if (content.startsWith(b)) {
      content = content.substr(b.length)
      content = content.substr(0, content.length - 3)
    }
    try {
      const b64 = await md2jpg((await genTemplate(sender.nickname, content)))
      switch (config.type) {
        case "mirai":
          sender.reply([{ type: 'Image', base64: b64 }], true)
          break
        default:
          sender.reply(segment.image('base64://' + b64), true)
          break
      }
    } catch(error: Error) {
      sender.reply('——————————————\nError: 4002\n' + error + '\n\n生成markdown图片失败辣 ...', true)
    }
  }
}

