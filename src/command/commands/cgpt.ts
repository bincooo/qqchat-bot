import { config } from 'src/config'
import { initOicq } from 'src/core/oicq'
import { BaseMessageHandler } from 'src/types'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import messageHandlers from './../../handler'

class CgptCommand extends BaseCommand {
  label = 'cgpt'
  usage = [
    'tts:on      - 开启语音',
    'tts:off     - 关闭语音',
    'catgirl:on  - 开启猫娘',
    'catgirl:off - 关闭猫娘',
    'reset       - 重置会话',
    + '\n—————————\n/draw [prompt] - ai作画'
  ]

  requiredAdministrator = false
  description = 'web chatgpt 配置'

  async execute (sender: Sender, params: string[]) {
    switch (params[0]) {
      case 'tts:on':
        sender.reply('open the voice mode ~', false)
        config.tts = true
        break
      case 'tts:off':
        sender.reply('close the voice mode ~', false)
        config.tts = false
        break
      case 'catgirl:on':
        sender.reply('enable the cat girl ~', false)
        config.api.enablePref = true
        break
      case 'catgirl:off':
        sender.reply('disable the cat girl ~', false)
        config.api.enablePref = false
        break
      default:
        sender.reply(this.helpDoc, true)
        break
    }
  }

  override showHelp(): boolean {
    return !!config.api.enable
  }
}

export default CgptCommand
