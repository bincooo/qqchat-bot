
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

let mid: string | null = null

async function recallLdGif(render: any) {
  if (mid) {
    await render.recallMsg(mid)
  }
}

async function loading(render: any, isEnd: boolean = false) {
  if (!isEnd) {
    const ret = await render.reply(ldGif)
    mid = ret.message_id
  }
}

export const buildLazyMessage = (conversationMap: any) => {
  let isEnd = true
  return async (data: any) => {
    //console.log('conversationMap', conversationMap)
    if (!conversationMap) return
      //console.log('ts: ', data)
    if (!conversationMap.has(data.conversationId)) return
    const render: any = conversationMap.get(data.conversationId)

    let cached = {
      idx: 0,
      cachedMsg: ''
    }
    if (conversationMsgMap.has(data.conversationId)) {
      cached = conversationMsgMap.get(data.conversationId)
    } else {
      conversationMsgMap.set(data.conversationId, cached)
    }
  
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
        recallLdGif(render)
        if (cached.idx < cached.cachedMsg.length) {
          // console.log('ts: ', cached.cachedMsg.substr(cached.idx))
          const msg = cached.cachedMsg.substr(cached.idx)
          if (msg && msg.trim()) {
            if (config.tts) {
              const path = await speak({ text: msg })
              render.reply(segment.record(path), false)
            }
            else {
              render.reply(msg, false)
            }
          }
        }
        conversationMsgMap.delete(data.conversationId)
        return
      }
      cached.cachedMsg = data.response
      if (index > 0 && cached.idx < index) {
        // console.log('ts: ', data.response.substr(cached.idx, index))
        const msg = data.response.substr(cached.idx, index)
        if (msg && msg.trim()) {
          isEnd = false
          if (config.tts) {
            recallLdGif(render)
            speak({ text: msg }).then(path => {
              render.reply(segment.record(path), false)
                .then(() => loading(render))
            })
          } else {
            recallLdGif(render)
            render.reply(msg, false)
              .then(() => loading(render, isEnd))
          }
        }
        cached.idx = index
      }
    }
  }
}

