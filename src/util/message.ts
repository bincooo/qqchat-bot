
import { segment } from 'oicq'
import { config } from '../config'
import speak from './tts'
const replaceMapping = {
  '，': ',',
  '！': '!',
  '。': '.',
  '？': '?'
}
// const noDuplicationChar = ['，', ',', '!', '！', '?', '？', '']

/**
 * 消息 tokens优化
 */
export function filterTokens (content: string) {
  // content.replaceAll(/，|。|！/g, ' ')
  let resultMessage = ''
  for (let i = 0; i < content.length; i++) {
    if (resultMessage.at(-1) === content[i]) {
      if (content[i] === ' ') continue
    }
    if (replaceMapping[content[i]] !== undefined) {
      resultMessage += replaceMapping[content[i]] as string
    } else {
      resultMessage += content[i]
    }
  }
  return resultMessage.trim()
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

async function loading(render: any, isEnd: boolean = false) {
  if (!isEnd) {
    const ret = await render.reply(ldGif)
    mids.push(ret.message_id)
  }
}

function cacheMessage(conversationId: string): any {
  if (conversationMsgMap.has(conversationId)) {
    return conversationMsgMap.get(conversationId)
  }

  let cached = {
    idx: 0,
    msg: ''
  }
  conversationMsgMap.set(conversationId, cached)
  return cached
}

export const onMessage = (data: any, render: any) => {
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
  
    //console.log(index, data.response)
    if (data.response == '[DONE]') {
      isEnd = true
      if (cached.idx < cached.msg.length) {
        // console.log('ts: ', cached.msg.substr(cached.idx))
        const msg = cached.msg.substr(cached.idx)
        if (msg && msg.trim()) {
          if (config.tts) {
            speak({ text: msg })
              .then(path => render.reply(segment.record(path), true))
              .then(recallLdGif)
          }
          else {
            render.reply(msg, true)
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
      const msg = data.response.substr(cached.idx, index)
      if (msg && msg.trim()) {
        isEnd = false
        if (config.tts) {
          recallLdGif()
          speak({ text: msg }).then(path => {
            render.reply(segment.record(path), true)
              .then(() => loading(render, isEnd))
          })
        } else {
          recallLdGif()
          render.reply(msg, true)
            .then(() => loading(render, isEnd))
        }
      }
      cached.idx = index
    }
  }
}

