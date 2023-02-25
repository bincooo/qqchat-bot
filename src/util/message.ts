import { segment, Sendable } from 'oicq'
import logger from 'src/util/log'
import { config } from '../config'
import { Sender } from 'src/model/sender'
import speak from './tts'
import messageHandler from 'src/filter'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { getClient } from 'src/core/oicq'
import * as parser from './parser'
import delay from 'delay'


/**
 * 消息 tokens优化
 */
export async function filterTokens (content: string) {
  const filters = messageHandler.filter(item => item.type === 0)
  return (await _filterTokens(content, filters)).trim()
}

async function _filterTokens(content: string, filters: Array<BaseMessageFilter>, sender?: Sender, done?: boolean) {
  if (filters.length === 0) return content.trim()
  let resultMessage = ''

  try {
    for (let i = 0; i < filters.length; i++) {
      let isStop = false
      if (filters[i] instanceof BaseMessageFilter) {
        const [ stop, msg ] = await (filters[i] as BaseMessageFilter).handle(content, sender, done)
        isStop = !stop
        resultMessage = msg
      }
      if (isStop) {
        break
      }
    }
  } catch (err) {
    logger.error(err)
  }

  return resultMessage.trim()
}



function dat(): number {
  return new Date()
    .getTime()
}


// --------------------------
let globalParser: null | parser.MessageParser
let globalStatManager: null | StatManager


export function globalLoading(sender: Sender) {
  initStatManager()
  globalStatManager.sendLoading(sender, { init: true, isEnd: false })
}

export async function globalRecall() {
  initStatManager()
  await globalStatManager.recall()
}


class StatManager {

  protected _GIF: Sendable = segment.image('./loading.gif')
  protected _messageContiner: Array<string> = []
  protected _isEnd: boolean = true
  protected _previousTimestamp: number = 0
  protected _timer: NodeJS.Timer | null = null
  protected _globalTimer: NodeJS.Timer

  constructor() {
    this._globalTimer = setInterval(() => {
      if (this._isEnd) {
        this.recall()
      }
    }, 1000)
  }

  clear() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  }

  sendLoading(
    sender: Sender,
    other?: {
      init: boolean
      isEnd: boolean
    }
  ) {
    if (other?.init) {
      this._isEnd = other?.isEnd
      this._previousTimestamp = dat()
    }

    this.clear()
    this._timer = setInterval(async () => {
      if (this._isEnd) {
        this.clear()
        await this.recall()
        return
      }
      if (this._previousTimestamp + 3000 < dat()) {
        await this.recall()
        const result = await sender.reply(this._GIF)
        this._messageContiner.push(result.message_id)
        this.clear()
      }
    }, 500)
  }

  async recall() {
    let messageId
    do {
      messageId = this._messageContiner.shift()
      if(messageId) {
        const result = await getClient()?.deleteMsg(messageId)
        if (!result) {
          await delay(500)
          await getClient()?.deleteMsg(messageId)
        }
      }
    } while(!!messageId)
  }

  setIsEnd(isEnd: boolean) {
    this._isEnd = isEnd
    if (isEnd) {
      this._previousTimestamp = dat() + 60 * 1000
      return
    }
    this._previousTimestamp = dat()
  }
}


function initParser() {
  if (globalParser) return

  const codeCondit = (text, index) => {
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

  const condition: Array<parser.Condition> = [
    codeCondit,
    "。\n",
    "。", 
    ".\n"
  ]

  globalParser = new parser.MessageParser({ condition })
}

function initStatManager() {
  if (globalStatManager) return
  globalStatManager = new StatManager()
}

export const onMessage = async (data: any, sender: Sender) => {
  initParser()
  initStatManager()

  if (data.response) {
    const filters = messageHandler.filter(item => item.type === 1)
    //console.log(index, data.response)
    let message: string | null = globalParser.resolve(data)
    const isDone = () => (data.response == '[DONE]')


    if (!!message) {
      message = await _filterTokens(message, filters, sender, isDone())
      if (isDone()) {
        globalStatManager.setIsEnd(true)
      }
      if (!!message) {
        console.log('message ======', message)
        globalStatManager.setIsEnd(false)

        if (isDone()) {
          if (config.tts) {
            const path = await speak({ text: message })
            await sender.reply(segment.record(path), true)
            await globalStatManager.recall()
          }
          else {
            await sender.reply(message, true)
            await globalStatManager.recall()
          }
        } else {
          if (config.tts) {
            const path = await speak({ text: message })
            await sender.reply(segment.record(path), true)
            globalStatManager.sendLoading(sender)
          } else {
            await sender.reply(message, true)
            globalStatManager.sendLoading(sender)
          }
        }
      }
    }
  }
}

