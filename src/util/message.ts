import { segment } from 'oicq'
import logger from 'src/util/log'
import { config } from '../config'
import { Sender } from 'src/model/sender'
import speak from './tts'
import messageHandler from 'src/filter'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { getClient } from 'src/core/oicq'
import * as parser from './parser'


/**
 * 消息 tokens优化
 */
export async function filterTokens (content: string) {
  const filters = messageHandler.filter(item => item.type === 0)
  return (await _filterTokens(content, filters)).trim()
}

async function _filterTokens(content: string, filters: Array<BaseMessageFilter>, sender?: Sender) {
  if (filters.length === 0) return content.trim()
  let resultMessage = ''

  try {
    for (let i = 0; i < filters.length; i++) {
      let isStop = false
      if (filters[i] instanceof BaseMessageFilter) {
        const [ stop, msg ] = await (filters[i] as BaseMessageFilter).handle(content, sender)
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
const ldGif = segment.image('./loading.gif')
const mids: Array<string> = []
let isEnd: boolean = true
let previousTimestamp: number = dat()
let globalParser: null | parser.MessageParser

setInterval(() => {
  if (isEnd) {
    while (mids.length > 0) {
      recallLdGif()
    }
  }
}, 1000)

async function recallLdGif() {
  const mid = mids.shift()
  if (mid) {
    await getClient()?.deleteMsg(mid)
  }
}

let loadLock = false
export function loading(sender: Sender, _isEnd?: boolean = false, init?: boolean) {
  if (init) {
    isEnd = _isEnd
    if (!_isEnd) {
      sender.reply(ldGif)
        .then(res => mids.push(res.message_id))
      previousTimestamp = dat()
    }
    return
  }

  // 三秒内无回应, 发送加载Gif
  if (!_isEnd) {
    let timer: NodeJS.Timer | null = null
    const clear = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    timer = setInterval(() => {
      if (isEnd) {
        clear()
        recallLdGif()
        return
      }

      if (previousTimestamp + 3000 < dat()) {
        clear()
        if (!loadLock) {
          recallLdGif()
          loadLock = true
          sender.reply(ldGif)
            .then(res => {
              mids.push(res.message_id)
              loadLock =false
            })
            .catch(err => {
              loadLock =false
            })
        } 
      }
    }, 300)
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

export const onMessage = async (data: any, sender: Sender) => {
  initParser()

  if (data.response) {
    const filters = messageHandler.filter(item => item.type === 1)
    //console.log(index, data.response)
    let message: string | null = globalParser.resolve(data)
    const isDone = () => (data.response == '[DONE]')


    if (!!message) {
      message = await _filterTokens(message, filters, sender)
      if (!!message) {
        isEnd = false
        previousTimestamp = dat()

        if (isDone()) {
          isEnd = true
          if (config.tts) {
            speak({ text: message })
              .then(path => sender.reply(segment.record(path), true))
              .then(recallLdGif)
          }
          else {
            sender.reply(message, true)
              .then(recallLdGif)
          }
        } else {
          if (config.tts) {
            recallLdGif()
            speak({ text: message }).then(path => {
              sender.reply(segment.record(path), true)
                .then(() => loading(sender, isEnd))
            })
          } else {
            recallLdGif()
            sender.reply(message, true)
              .then(() => loading(sender, isEnd))
          }
        }
      }
    }
  }
}

