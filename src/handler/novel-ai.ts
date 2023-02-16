import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { draw } from 'src/util/draw'
import { filterTokens } from 'src/util/message'
import { segment } from 'oicq'

const pref = '/draw'

export class NovelAiHandler extends BaseMessageHandler {


  async reboot () {
  }

  handle = async (sender: Sender) => {
    if ((sender?.textMessage||'').startsWith(pref)) {
      sender.reply('正在努力作画, 稍等哦~', true)

      const data = initParams(
        filterTokens(sender?.textMessage.substr(pref.length))
      )
      const path = await draw({ data })
      sender.reply(segment.image(path), true)
      return false
    }

    return true
  }

}

const initParams = function(prompt: string): Array<any> {
  return [
    prompt,
    "",
    "naifu基础起手式",
    "None",
    28,
    "Euler a",
    false,
    false,
    1,
    1,
    7,
    -1,
    -1,
    0,
    0,
    0,
    false,
    512,
    512,
    false,
    0.7,
    0,
    0,
    "None",
    0.9,
    5,
    "0.0001",
    false,
    "None",
    "",
    0.1,
    false,
    false,
    false,
    false,
    "",
    "Seed",
    "",
    "Nothing",
    "",
    true,
    false,
    false,
    null
  ]
}