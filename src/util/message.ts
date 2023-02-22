import { segment } from 'oicq'
import logger from 'src/util/log'
import { config } from '../config'
import { Sender } from 'src/model/sender'
import speak from './tts'
import messageHandler from 'src/filter'
import { BaseMessageFilter, MessageFilter } from 'src/types'



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
const conversationMsgMap = new Map()
const breakBlocks = [
  // '```'
  function(text, index) {
    const block = '```'
    const currIndex = text.lastIndexOf(block)
    if (currIndex < 0 || currIndex < index) {
      return 0
    }
    if (currIndex + block.length <= index) {
      return -1
    }
    return currIndex + block.length
  },
  '。\n',
  '。', 
  '.\n',
]

const mids: Array<string> = []
let isEnd: boolean = true
let lastLoading: number = dat()

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
    await config.client.deleteMsg(mid)
  }
}


function loading(sender: Sender, isEnd: boolean = false) {
  // 三秒内无回应, 发送加载Gif
  if (!isEnd && (lastLoading + 3000) < dat()) {
    sender.reply(ldGif)
      .then(res => mids.push(res.message_id))
  }
}

declare type Cached = {
  idx: number
  msg: string
}

function cacheMessage(conversationId: string, cached?: Cached): Cached {
  if (cached) {
    if(conversationMsgMap.has(conversationId))
      conversationMsgMap.delete(conversationId)
    conversationMsgMap.set(conversationId, cached)
    return cached
  }

  if (conversationMsgMap.has(conversationId)) {
    return conversationMsgMap.get(conversationId)
  }

  let c: Cached = {
    idx: 0,
    msg: ''
  }
  conversationMsgMap.set(conversationId, c)
  return c
}

export const onMessage = async (data: any, sender: Sender) => {
  let cached: any = cacheMessage(data.conversationId)

  if (data.response) {
    let index
    for (let i in breakBlocks) {
      const block = breakBlocks[i]
      if (typeof(block) == 'string') {
        index = data.response.lastIndexOf(block)
          if (index > 0) {
            index += block.length
            break
          }
      } else {
        index = block(data.response, cached.idx)
        if (index == -1) break
        if (index > 0) break
      }
    }
  
    const filters = messageHandler.filter(item => item.type === 1)
    //console.log(index, data.response)
    if (data.response == '[DONE]') {
      isEnd = true
      if (cached.idx < cached.msg.length) {
        // console.log('ts: ', cached.msg.substr(cached.idx))
        let msg = cached.msg.substr(cached.idx)
        console.log('139 onMessage test: ', msg)
        msg = await _filterTokens(msg, filters, sender)
        if (msg && msg.trim()) {
          lastLoading = dat()
          if (config.tts) {
            speak({ text: msg })
              .then(path => sender.reply(segment.record(path), true))
              .then(recallLdGif)
          }
          else {
            sender.reply(msg, true)
              .then(recallLdGif)
          }
        }
      }
      recallLdGif()
      conversationMsgMap.delete(data.conversationId)
      return
    }
    cached.msg = data.response
    if (index > 0 && cached.idx < index) {
      // console.log('ts: ', data.response.substr(cached.idx, index))
      let msg = data.response.substr(cached.idx, index - cached.idx)
      console.log('162 onMessage test: ', msg, cached.idx, index)
      msg = await _filterTokens(msg, filters, sender)
      if (msg && msg.trim()) {
        isEnd = false
        lastLoading = dat()
        if (config.tts) {
          recallLdGif()
          speak({ text: msg }).then(path => {
            sender.reply(segment.record(path), true)
              .then(() => loading(sender, isEnd))
          })
        } else {
          recallLdGif()
          sender.reply(msg, true)
            .then(() => loading(sender, isEnd))
        }
      }
      cached.idx = index
      cacheMessage(data.conversationId, cached)
    }
  }
}

