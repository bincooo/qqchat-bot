import { type ChatMessage } from 'src/types'
import { config } from 'src/config'


export type Condition = (string | ((tex: string, idx: number) => number))
export type Cached = {
  old?: { index: number, fragment?: string }
  index: number
  message: string
}

export class MessageParser {
  protected _condition: Array<Condition>
  protected _cacheMapper = new Map<string, Cached>()

  constructor(opts: {
    condition?: Array<Condition>
  })
  {
    const {
      condition = []
    } = opts

    this._condition = condition
  }

  pushCondition(item: (string | ((tex: string, idx: number) => number) )) {
    this._condition.push(item)
  }

  cacheMessage(conversationId: string, cached?: Cached): Cached {
    if (cached) {
      this._cacheMapper.set(conversationId, cached)
      return cached
    }

    if (this._cacheMapper.has(conversationId)) {
      return this._cacheMapper.get(conversationId) as Cached
    }

    const _new: Cached = {
      index: 0,
      message: ''
    }
    this._cacheMapper.set(conversationId, _new)
    return _new
  }

  resolve(data: ChatMessage): string | null {
    const cached = this.cacheMessage(data.conversationId)
    const IsDONE = (data.text === '[DONE]')

    let index,
      condition = [... this._condition]
    for (let i in condition) {
      if (IsDONE) break
      let condit = condition[i]
      if (typeof(condit) == 'string') {
        const len = (condit.match(/([0-9]+):.+/)??[])[1]
        condit = !len ? condit : condit.substr(len.length + 1)
        index = data.text.lastIndexOf(condit)
        if (index > 0) {
          index += condit.length
          if (len) {
            if (parseInt(len) < index - cached.index) {
              break
            }
          } else break
        }
      } else {
        index = condit(data.text, cached.index)
        if (index == -1 || index > 0) break
      }
    }

    const assert = (c: Cached) => {
      const _index = IsDONE ? c.message?.length : index
      return (c.index !== c.old?.index && c.index < _index)
    }

    if (IsDONE) {
      this._cacheMapper.delete(data.conversationId)
      return assert(cached) ? cached.message.substr(cached.index) : null
    }

    cached.message = data.text
    if (index > 0 && assert(cached)) {
      const message = data.text.substr(cached.index, index - cached.index)
      const old = {
        index: cached.index,
        fragment: message
      }
      cached.old = old
      cached.index = index
      this.cacheMessage(data.conversationId, cached)
      return message
    }

    return null
  }
}

export function initHandler(): Array<Condition> {
  // 代码解析处理
  const codeHdr = (text, index) => {
    const block = '```'
    const currIndex = text.lastIndexOf(block)
    if (currIndex < 0 || currIndex < index) {
      return 0 // continue
    }
    if (currIndex + block.length <= index) {
      return -1 // break
    }
    return currIndex + block.length
  }

  // dan模式解析处理
  // const danModelHdr = (text, index) => {
  //   const b = '(🔒Normal Output)'
  //   const e = '\n\n'

  //   // 检测dan模式
  //   const currIndex = text.lastIndexOf(b)
  //   // 没有检测到则进入下一个解析处理程序
  //   if (currIndex < 0 || currIndex < index) {
  //     return 0 // continue
  //   }

  //   // 已检测到了dan模式，但是也是上一个检测的结果
  //   // 则不需要进入下一个解析处理程序
  //   if (currIndex + b.length <= index) {
  //     // 再次检查有没有dan模式的结束字符块
  //     const endIdx = text.lastIndexOf(e)
  //     if (currIndex < endIdx) {
  //       return endIdx + e.length
  //     }
  //     return -1 // break
  //   }

  //   // 这是一个新的dan检测结果
  //   return currIndex + b.length
  // }
  const { parseMinimum } = config
  return [
    codeHdr,
    parseMinimum + ":。\n",
    parseMinimum + ":。",
    (parseMinimum + 50) + ":.\n",
    (parseMinimum + 50) + ":!\n\n",
    (parseMinimum + 50) + ":\n\n",
  ]
}