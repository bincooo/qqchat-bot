import { config, lang } from 'src/config'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import stateManager from 'src/util/state'

class CgptCommand extends BaseCommand {
  label = 'cgpt'
  usage = [
    `tts:on/off/lang     ${this.sp(12)}开/关语音模式`
    + '\n----'
    + '\n!reset  - 重置会话'
    + '\n/draw [tag] - ai作画\n'
    + '\n[tag]+文字 - 让Ai根据文字生成tag'
    + '\nhttps://www.icu-web.tk:8082/tag\n可通过该站点定制ai绘画标签'
    + '\n----'
    + '\n[code]+文字 - 代码片段优化(代码片段转图片)'
    + '\n[md(:latex)]+文字 - [md]以md格式转图片,[md:latex]以md格式转图片(数学公式增强)'
    + '\n[online]+文字 - chatgpt联网查询'
  ]

  requiredAdministrator = false
  description = 'web chatgpt 配置'

  async execute (sender: Sender, params: string[]) {
    const state = stateManager.getState(sender.id)
    switch (params[0]) {
      case 'tts':
      case 'tts:on':
        sender.reply([ { type: 'Plain', value: '已开启语音模式 ~' } ], true)
        state.tts = true
        break
      case 'tts:off':
        sender.reply([ { type: 'Plain', value: '已关闭语音模式 ~' } ], true)
        state.tts = false
        break
      case 'tts:lang':
        const key = params[1]??'none'
        const value = lang[key]
        if (!value) {
          sender.reply([ { type: 'Plain', value: '语音类型不存在 ~\n' + this.langDoc() } ], true)
          break
        }
        const split = value.split(':')
        const emptyToUndef = (tex: string) => {
          return (!!tex) ? tex : undefined
        }
        sender.reply([ { type: 'Plain', value: '已切换' + split[0] + '语音 ~' } ], true)
        state.lang = emptyToUndef(split[1])??'zh-CN-XiaoyiNeural'
        state.sname = emptyToUndef(split[2])??'general'
        state.pitch = parseInt(emptyToUndef(split[3])??'0')
        break
      default:
        sender.reply([ { type: 'Plain', value: this.helpDoc } ], true)
        break
    }
  }

  override showHelp(): boolean {
    return !!config.WebGPT.enable
  }

  langDoc() {
    return Object.keys(lang)
      .map(key => `${key} - ${lang[key].split(':')[0]}`)
      .join('\n')
  }
}

export default CgptCommand
