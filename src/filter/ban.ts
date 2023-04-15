import { BaseMessageFilter, MessageFilter } from 'src/types'
import { loadConfig, writeConfig } from 'src/util/config'
import { config } from 'src/config'
import getClient from 'src/core'


const configFile = process.cwd() + '/conf/ban.json'

function IsNumber(val: string | number) {
 if (typeof val === 'number') {
  return true
 }
 const num = parseInt(val)
 return !Object.is(num, NaN)
}

async function saveConfig(banList: (number | string)[]) {
  await writeConfig(banList, configFile)
}

export class BanFilter extends BaseMessageFilter {
  protected _banList: (number | string)[] = []
  constructor() {
    super()
    this.type = 0
    loadConfig(configFile)
      .then(ban => {
        this._banList = ban ?? []
      })
  }

  handle = async (content: string, sender?: Sender) => {
    if (content?.trim().startsWith('ban ') && sender.group) {
      if (!sender.isAdmin) {
        sender.reply('你没有权限使用该命令 ~', true)
        return [ false,  "" ]
      }
      const qq = content.trim()
        .split(' ')[1]
      if (!IsNumber(qq)) {
        sender.reply('请输入正确的QQ号 ~', true)
        return [ false,  "" ]
      }

      const e: any = sender.getEvent()
      switch(config.type) {
      case 'mirai':
        const info = await getClient()
          .target
          .api
          .memberInfo(e.sender.group?.id, parseInt(qq))
        if (info && info.id == qq) {
          this._banList.push(qq)
          await saveConfig(this._banList)
          sender.reply(`【${info.memberName}】已加入黑名单 ~`, true)
          return [ false,  "" ]
        } else {
          sender.reply('请输入正确的QQ号 ~', true)
          return [ false,  "" ]
        }
        break
      default:
        // TODO oicq
        break
      }
    }

    if (content?.trim().startsWith('unban ') && sender.group) {
      const qq = content.trim()
        .split(' ')[1]
      if (!this._banList.find(it => it == qq)) {
        sender.reply(qq + ' 不在黑名单列表中 ~', true)
        return [ false,  "" ]
      }
      const e: any = sender.getEvent()
      const index = this._banList.indexOf(qq)
      this._banList.splice(index, 1)
      await saveConfig(this._banList)
      switch(config.type) {
      case 'mirai':
        const info = await getClient()
          .target
          .api
          .memberInfo(e.sender.group.id, parseInt(qq))
        if (info && info.id == qq) {
          sender.reply(`【${info.memberName}】已移除黑名单 ~`, true)
          return [ false,  "" ]
        } else {
          sender.reply(`【${qq}】已移除黑名单 ~`, true)
          return [ false,  "" ]
        }
        break
      default:
        // TODO oicq
        break
      }
    }

    if (this._banList.find(it => it == sender.userId)) {
      return [ false, "" ]
    }
    return [ true, content ]
  }
}