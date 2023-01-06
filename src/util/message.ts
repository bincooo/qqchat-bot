
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

export const buildLazyMessage = (conversationMap: any) => {
  return (data: any) => {
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
        if (cached.idx < cached.cachedMsg.length) {
          // console.log('ts: ', cached.cachedMsg.substr(cached.idx))
          const msg = cached.cachedMsg.substr(cached.idx)
          if (msg && msg.trim()) {
            if (config.tts) {
              speak({text: msg, vname: 'zh-CN-XiaoshuangNeural', sname: 'general'}, 'audio-24khz-96kbitrate-mono-mp3')
                .then(path => {
                  render.reply(segment.record(path), false)
                })
            } else
              render.reply(msg + '\n\n- end -', false)

          } else {
            if (!config.tts)
              render.reply('- end -', false)
          }
      
        } else {
          if (!config.tts)
            render.reply('- end -', false)
        }
        conversationMsgMap.delete(data.conversationId)
        return
      }
      cached.cachedMsg = data.response
      if (index > 0 && cached.idx < index) {
        // console.log('ts: ', data.response.substr(cached.idx, index))
        const msg = data.response.substr(cached.idx, index)
        if (msg && msg.trim()) {
          if (config.tts) {
            speak({text: msg, vname: 'zh-CN-XiaoshuangNeural', sname: 'general'}, 'audio-24khz-96kbitrate-mono-mp3')
              .then(path => {
                render.reply(segment.record(path), false)
              })
          } else
            render.reply(msg, false)
        }
        cached.idx = index
      }
    }
  }
}

