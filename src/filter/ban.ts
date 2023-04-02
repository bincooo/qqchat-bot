import { BaseMessageFilter, MessageFilter } from 'src/types'
import { config } from 'src/config'
import getClient from 'src/core'

const replaceMapping = {
  '，': ',',
  '！': '!',
  '。': '.',
  '？': '?'
}

export class BanFilter extends BaseMessageFilter {
  protected _banList: (number | string)[] = []
  constructor() {
    super()
    this.type = 0
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
        const info = getClient().api.memberInfo(e.sender.group.id, e.sender.id)
        console.log(info)
        break
      default:
        break
      }
    }
    return [ true, content ]
  }
}