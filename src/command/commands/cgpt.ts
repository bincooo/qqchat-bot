import { config } from 'src/config'
import { initOicq } from 'src/core/oicq'
import { BaseMessageHandler } from 'src/types'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import messageHandlers from './../../handler'

class ServerCommand extends BaseCommand {
  label = 'cgpt'
  usage = [
    'tts:on  - 开启语音模式',
    'tts:off - 关闭语音模式',
    'reset   - 重置会话'
  ]

  requiredAdministrator = true
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
      default:
        sender.reply(this.helpDoc, true)
        break
    }
  }

  showHelp(): boolean {
    return !!config.api.enable
  }
}

export default ServerCommand
