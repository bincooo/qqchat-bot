import fs from 'fs'
import yaml from 'js-yaml'
import { Mirai } from 'mirai-ts'
import type { MiraiApiHttpSetting, MessageType } from 'mirai-ts'
import logger from 'src/util/log'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import * as types from 'src/types'
import delay from 'delay'


let client: Mirai
let messageHandler: Array<types.MessageHandler | types.BaseMessageHandler>

const dats = () => {
  return new Date()
    .getTime()
}

async function handleMessage (e) {
  const sender = new Sender(e)
  try {
    for (let i = 0; i < messageHandler.length; i++) {
      let isStop = false
      if (messageHandler[i] instanceof types.BaseMessageHandler) {
        isStop = !await (messageHandler[i] as types.BaseMessageHandler).handle(sender)
      } else if (typeof messageHandler[i] === 'function') {
        isStop = !await (messageHandler[i] as types.MessageHandler)(sender)
      }
      if (isStop) {
        return
      }
    }
  } catch (err) {
    logger.error(err)
    sender.reply(`发生错误: ${err}`)
  }
}

function IsAt(chain: MessageType.MessageChain & {
  0: MessageType.Source
}) {
  if (chain.find(item => (
    (item.type === 'At' && item.target == config.botQQ) || 
    (item.type === 'Plain' && item.text.indexOf((config.botNickname ?? '_undef___')) >= 0))
  )) {
    return true
  }
  else return false
}

class MiraiImpl extends types.TalkWrapper {
  protected _mirai?: Mirai

  get target(): any {
    return this._mirai
  }

  /**
   * 初始化处理器
   */
  async initHandlers(initMessageHandler?: (types.MessageHandler | types.BaseMessageHandler)[]): void {
    messageHandler = initMessageHandler ?? messageHandler ?? []
    const { yaml: yamlConfig } = config.mirai
    const setting: MiraiApiHttpSetting = yaml.load(fs.readFileSync(yamlConfig, 'utf8'))
    const mirai = new Mirai(setting)
    await mirai.link(config.botQQ)
    let dat: number  = 0
    
    mirai.on('message', e => {
      if ([ 'FriendMessage', 'TempMessage' ].includes(e.type) || (e.type === 'GroupMessage' && IsAt(e.messageChain))) {
        // 自己的消息???
        if (e.sender.id == config.botQQ) {
          return
        }
        if (e.sender?.memberName !== 'Q群管家') {
          handleMessage(e)
        }
      }
    })

    mirai.on('MemberJoinEvent', async e => {
      if (e.member?.id == config.botQQ) {
        return
      }

      if (dat + 30000 < dats()) {
        const ds = dats()
        handleMessage(e)
      }
    })

    mirai.api.sendFriendMessage('已上线~', config.adminQQ)
    this._mirai = mirai
    mirai.listen()
  }

  /**
   * 基础信息
   */
  information(e: any): {
    textMessage: string
    nickname: string
    group?: string
  } & Record<string, (number | string)> {
    const result = {
    }
    result.userId = e.sender?.id
    result.isAdmin = e.sender?.id == config.adminQQ
    result.nickname = (e.sender?.memberName ?? e.sender?.nickname ?? e.sender?.id) + ''
    result.group = (e.type === 'GroupMessage' ? e.sender.group : undefined)
    result.textMessage = e.messageChain?.filter(item => item.type === 'Plain').map(item => item.text).join().trim()??''
    if (!IsAt(e.messageChain) && !!config.botNickname) {
      result.textMessage = result.textMessage?.replaceAll(config.botNickname, '')?.trim()??''
    }
    return result
  }

  /**
   * 会话Id
   */
  sessionId(e: any): number {
    // console.log('[119] mirai::sessionId ===>>>', e)
    return (e.type === 'GroupMessage') ? e.sender.group.id : e.sender?.id
  }

  /**
   * 回复消息
   */
  async reply(e: any, chain: types.TalkChain[], quote?: boolean = false): [ boolean, any ] {
    const content = chain?.map(it => {
      switch(it.type) {
      case 'Plain':
        return { type: 'Plain', text: it.value }
      case 'Image':
        return { type: 'Image', base64: it.value }
      case 'Voice':
        return { type: 'Voice', base64: it.value }
      case 'At':
        return { type: 'At', target: it.value }
      default:
        throw new Error('oicq reply error: unknown type `' + it.type + '`.')
      }
    })
    if (!content) return [ true, {messageId: -1, target: -1 }]
    let result = await e.reply(content, quote)
    let count = 5
    while (count > 0 && result.code == 500) {
      count --
      await delay(3000)
      // 尝试添加一个字符串id干扰腾讯判断
      result = await e.reply([{ type: 'Plain', text: btoa(`retry ${count}`) + '\n\n' }, ...content], quote)
      if (config.debug)
        console.log('reply result code[500], retry ' + (3 - count) + ' ...', chain, result)
      if (result.code == 0)
        break
    }
    // 发送错误，尝试转发消息发送
    if(result.code == 500) {
      const { nickname } = this.information(e)
      result = await e.reply([{
        title: `${nickname}的聊天记录`,
        brief: '[聊天记录]',
        type: 'Forward',
        nodeList: content
      }])
      if (config.debug)
        console.log('reply result code[500], Forward: ', chain, result)
    }
    return [ (result.code == 0), { messageId: result.messageId, target: this.sessionId(e) } ]
  }

  /**
   * 撤回消息
   */
  async recall(target: any): boolean {
    if (config.debug)
      console.log('sender recall message: ', target)
    this._mirai.api.recall(target)
    return true
  }
}

export default new MiraiImpl()

