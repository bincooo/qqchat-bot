import { segment, Sendable } from 'oicq'
import logger from 'src/util/log'
import { config } from '../config'
import { Sender } from 'src/model/sender'
import speak from './tts'
import messageHandler from 'src/filter'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { QueueReply } from 'cgpt'
import { getClient } from 'src/core/oicq'
import * as parser from './parser'
import { japaneseUnicodeParser } from 'src/util/lang'
import stateManager from 'src/util/state'
import delay from 'delay'


/**
 * 消息 tokens优化
 */
export async function filterTokens (content: string, sender?: Sender) {
  if (config.debug) {
    console.log('request message ======', content)
  }
  const filters = messageHandler.filter(item => item.type === 0)
  return (await _filterTokens(content, filters, sender))
}

async function _filterTokens(content: string, filters: Array<BaseMessageFilter>, sender?: Sender, done?: boolean) {
  if (filters.length === 0) return content.trim()
  let resultMessage: QueueReply = ''

  try {
    for (let i = 0; i < filters.length; i++) {
      let isStop = false
      if (filters[i] instanceof BaseMessageFilter) {
        const [ stop, reply ] = await (filters[i] as BaseMessageFilter).handle(content, sender, done)
        isStop = !stop
        resultMessage = reply
      }
      if (isStop) {
        break
      }
    }
  } catch (err) {
    logger.error(err)
  }

  return resultMessage??content?.trim()
}



function dat(): number {
  return new Date()
    .getTime()
}


// --------------------------
let globalParser: null | parser.MessageParser


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
    "100:。\n",
    "100:。",
    "150:.\n",
    "150:\n\n"
  ]

  globalParser = new parser.MessageParser({ condition })
}

export const onMessage = async (data: any, sender: Sender) => {
  initParser()

  if (data.response) {
    const filters = messageHandler.filter(item => item.type === 1)
    //console.log(index, data.response)
    let message: string | null = globalParser.resolve(data)
    const isDone = () => (data.response === '[DONE]')
    
    if (!!message || isDone()) {
      stateManager.setIsEnd(sender, isDone())
      message = await _filterTokens(message??'', filters, sender, isDone())
      if (config.debug) {
        console.log('response message ====== [' + isDone() + ']', data, message)
      }

      const parserJapen = (state: any, tex: string) => {
        // const count = japaneseUnicodeParser.count(tex)
        // 0.2 的权重，超过这个阈值就判定它是日文
        // const is = (japaneseUnicodeParser.filter(tex).length * .2 < count)
        return {
          vname: /*is ? 'ja-JP-AoiNeural' :*/ state.lang??'zh-CN-XiaoshuangNeural',
          rate: /*is ? -5 :*/ 0
        }
      }
      
      if (!!message?.trim()) {
        const state = stateManager.getState(sender.id)
        if (isDone()) {
          await sender.reply(message, true)
          await stateManager.recallLoading(sender.id)
        } else {
          await sender.reply(message, true)
          stateManager.sendLoading(sender)
        }

        if (state.tts) {
          try {
            const path = await speak({ text: message.trim(), ...parserJapen(state, message) })
            await sender.reply(segment.record(path))
          } catch(err) {
            sender.reply(`语音发生错误\n${err}`)
          }
        }
      }
    }
  }
}

