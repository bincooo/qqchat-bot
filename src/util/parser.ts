import { ChatResponse } from 'cgpt'


export type Condition = (string | (tex: string, idx: number) => number)
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

  pushCondition(item: (string | (tex: string, idx: number) => number)) {
    this._condition.push(item)
  }

  cacheMessage(conversationId: string, cached?: Cached): Cached {
    if (cached) {
      this._cacheMapper.set(conversationId, cached)
      return cached
    }

    if (this._cacheMapper.has(conversationId)) {
      const ca = this._cacheMapper.get(conversationId)
      return ca
    }

    const _new: Cached = {
      index: 0,
      message: ''
    }
    this._cacheMapper.set(conversationId, _new)
    return _new
  }

  resolve(data: ChatResponse): string | null {
    const cached = this.cacheMessage(data.conversationId)
    let index,
      condition = [... this._condition]
    for (let i in condition) {
      const condit = condition[i]
      if (typeof(condit) == 'string') {
        index = data.response.lastIndexOf(condit)
          if (index > 0) {
            index += condit.length
            break
          }
      } else {
        index = condit(data.response, cached.index)
        if (index == -1 || index > 0) break
      }
    }

    const assert = (c: Cached) => {
      return (c.index !== c.old?.index && c.index < index)
    }

    if (data.response === '[DONE]') {
      this._cacheMapper.delete(data.conversationId)
      return assert(cached) ? cached.message.substr(cached.index) : null
    }

    cached.message = data.response
    if (index > 0 && assert(cached)) {
      const message = data.response.substr(cached.index, index - cached.index)
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