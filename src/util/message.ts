import { segment, Sendable } from 'oicq'
import logger from 'src/util/log'
import { config, preset } from '../config'
import { Sender } from 'src/model/sender'
import speak, { azureSpeak } from './tts'
import messageHandler from 'src/filter'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { QueueReply } from 'cgpt'
import { getClient } from 'src/core/oicq'
import * as parser from './parser'
import { japaneseUnicodeParser, speakUnicodeParser, r18UnicodeParser } from 'src/util/lang'
import stateManager from 'src/util/state'
import retry from 'src/util/retry'
import delay from 'delay'
import fs from 'fs'


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
  if (filters.length === 0) return content?.trim()
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

  return resultMessage ?? content?.trim()
}



function dat(): number {
  return new Date()
    .getTime()
}


// --------------------------
let globalParser: null | parser.MessageParser


function initParser() {
  if (globalParser) return
  const condition = parser.initHandler()
  globalParser = new parser.MessageParser({ condition })
}

export const onMessage = async (data: any, sender: Sender) => {
  initParser()
  // console.log('onMessage ===>>', data)

  if (data.text) {
    const filters = messageHandler.filter(item => item.type === 1)
    const text = data.text
    const isDone = () => (text === '[DONE]')
    let message: string | null = globalParser.resolve(data)
    
    if (!!message || isDone()) {
      message = await _filterTokens(message??'', filters, sender, isDone())
      if (config.debug) {
        console.log('response message ====== [' + isDone() + ']', message)
      }

      const parserJapen = (state: any, tex: string) => {
        const count = japaneseUnicodeParser.count(tex)
        // 0.2 的权重，超过这个阈值就判定它是日文
        const is = (japaneseUnicodeParser.filter(tex).length * .2 < count)
        return {
          vname: is ? 'ja-JP-AoiNeural' : state.lang??'zh-CN-XiaoyiNeural',
          rate: is ? -5 : 0,
          sname: state.sname,
          pitch: state.pitch
        }
      }

      stateManager.setIsEnd(sender, isDone())
      
      
      if (!!message?.trim()) {
        const state = stateManager.getState(sender.id)

        if (state.tts) {
          try {
            const speakSdk = config.azureSdk.enable ? azureSpeak : speak
            const path = await retry(() => speakSdk({
              text: speakUnicodeParser.filter(message.trim()),
              ...parserJapen(state, message)
            }),
            3,
            300)
            console.log('speak path: ', path)
            const base64 = fs.readFileSync(path)
              .toString('base64')
            await sender.reply([{ type: 'Voice', value: base64 }], true)
          } catch(err) {
            console.log("语音发生错误", err)
            sender.reply(`语音发生错误\n${err.message??err}`)
          }
        }

        try {
          await sender.reply([{ type: 'Plain', value: r18UnicodeParser.filter(message) }], true)
          console.log('12323223232323222===')
          if (isDone()) {
            delay(800)
            stateManager.setIsEnd(sender, true)
            await stateManager.recallLoading(sender.id)
          } else {
            stateManager.sendLoading(sender)
          }
        } catch(err) {
          console.log("发送QQ消息发生错误", err)
        }
      }

    }
  }
}

export function playerIsAwakening(state: any, content: string): string {
  if (!!state.preset?.key) {
    const player = preset.player.filter(item => item.key === state.preset.key)[0]
    if (!!player && !!player.maintenance) {
      return (player.maintenance.condition??[])
        .find(item => content.toLocaleLowerCase().indexOf(item) >= 0)
    }
    return null
  }
}

