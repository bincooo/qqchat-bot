import { BaseMessageFilter, MessageFilter } from 'src/types'
import { loadConfig, writeConfig } from 'src/util/config'
import { config } from 'src/config'
import getClient from 'src/core'

export class BanFilter extends BaseMessageFilter {
  protected _banList: (number | string)[] = []
  constructor() {
    super()
    this.type = 0
    const configFile = process.cwd() + '/conf/ban.json'
    const ban: (number | string)[] = loadConfig(configFile)
    this._banList = ban
  }

  handle = async (content: string, sender?: Sender) => {
    if (content?.trim().startsWith('ban ') /*&& sender.group*/) {
      if (!sender.isAdmin) {
        sender.reply('你没有权限使用该命令~', true)
        return [ false,  "" ]
      }
      const args = content.trim()
        .split(' ')
      const e: any = sender.getEvent()
      switch(config.type) {
      case 'mirai':
        const info = getClient()
          .target
          .api
          .memberInfo(e.sender.group.id, e.sender.id)
        console.log(info)
        break
      default:
        break
      }
    }
    return [ true, content ]
  }
}