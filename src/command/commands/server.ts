import { initOicq } from 'src/core/oicq'
import { BaseMessageHandler } from 'src/types'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import messageHandlers from './../../handler'
import { config, preset } from '../../config'
import { existsConfig, loadConfig, loadPresets } from 'src/util/config'
import path from 'path'

class ServerCommand extends BaseCommand {
  label = 'server'
  usage = [
    `reboot   ${this.sp(7)}重启机器人`,
    `status   ${this.sp(9)}服务器状态`,
    // `draw:on/off  ${this.sp(6)}开/关画质增强`,
    `debug:on/off ${this.sp(6)}开/关调试模式`,
    'load:preset  加载预设'
  ]

  requiredAdministrator = true
  description = '服务操作相关命令'

  async execute (sender: Sender, params: string[]) {
    switch (params[0]) {
      case 'reboot':
        sender.reply('重启中, 稍等~')
        await Promise.all(
          messageHandlers.map(async item => {
            if (item instanceof BaseMessageHandler) {
              await item.reboot()
            }
          })
        )
        // await initOicq()
        break
      case 'status':
        sender.reply(JSON.stringify(process.memoryUsage()), true)
        break
      // case 'draw':
      // case 'draw:on':
      //   config.api.betterPic = true
      //   sender.reply([ { type: 'Plain', value: '已开启画质增强~' } ])
      //   break
      // case 'draw:off':
      //   config.api.betterPic = false
      //   sender.reply([ { type: 'Plain', value: '已关闭画质增强~' } ])
      //   break
      case 'debug':
      case 'debug:on':
        config.debug = true
        sender.reply([ { type: 'Plain', value: '已开启调试模式~' } ])
        break
      case 'debug:off':
        config.debug = false
        sender.reply([ { type: 'Plain', value: '已关闭调试模式~' } ])
        break
      case 'load:preset':
        const presetPath = path.join(process.cwd(), '/conf/preset.json')
        if (existsConfig(presetPath)) {
          await loadPresets(presetPath)
          sender.reply([ { type: 'Plain', value: '加载预设完成~' } ])
        } else sender.reply([ { type: 'Plain', value: '加载预设失败~' } ])
        break
      default:
        sender.reply([ { type: 'Plain', value: this.helpDoc } ], true)
        break
    }
  }
}

export default ServerCommand
