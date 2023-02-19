import { initOicq } from 'src/core/oicq'
import { BaseMessageHandler } from 'src/types'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import messageHandlers from './../../handler'
import { config } from '../../config'

class ServerCommand extends BaseCommand {
  label = 'server'
  usage = [
    'reboot       - 重启机器人',
    'status       - 服务器状态',
    'better_pic:on  - 开启画质增强',
    'better_pic:off - 关闭画质增强'
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
      case 'better_pic:on':
        config.api.betterPic = true
        sender.reply('已开启画质增强~')
        break
      case 'better_pic:off':
        config.api.betterPic = false
        sender.reply('已关闭画质增强~')
        break
      default:
        sender.reply(this.helpDoc, true)
        break
    }
  }
}

export default ServerCommand
