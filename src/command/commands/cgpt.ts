import { config } from 'src/config'
import { initOicq } from 'src/core/oicq'
import { BaseMessageHandler } from 'src/types'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import messageHandlers from './../../handler'

class CgptCommand extends BaseCommand {
  label = 'cgpt'
  usage = [
    `tts:on      ${this.sp(12)}开启语音`,
    `tts:off     ${this.sp(12)}关闭语音`
    // `catgirl:on  ${this.sp(10)}开启猫娘`,
    // `catgirl:off ${this.sp(10)}关闭猫娘`
    + '\n----'
    + '\n!reset  - 重置会话'
    + '\n/draw [prompt] - ai作画\n'
    + '\n[prompt]+文字 - 让Ai根据文字生成tag'
    + '\nhttp://h.icu-web.tk:8082/tag\n可通过该站点定制ai绘画标签'
    + '\n----'
    + '\n[code]+文字 - 代码片段优化(代码片段转图片)'
    + '\n[md]+文字 - 以markdown格式转图片'
    + '\n[md:latex]+文字 - 以markdown格式转图片(数学公式增强)'
  ]

  requiredAdministrator = false
  description = 'web chatgpt 配置'

  async execute (sender: Sender, params: string[]) {
    switch (params[0]) {
      case 'tts:on':
        sender.reply('已开启语音模式 ~', false)
        config.tts = true
        break
      case 'tts:off':
        sender.reply('已关闭语音模式 ~', false)
        config.tts = false
        break
      // case 'catgirl:on':
      //   sender.reply('已开启猫娘模式 ~', false)
      //   config.api.preface.enable = true
      //   break
      // case 'catgirl:off':
      //   sender.reply('已关闭猫娘模式 ~', false)
      //   config.api.preface.enable = false
      //   break
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
