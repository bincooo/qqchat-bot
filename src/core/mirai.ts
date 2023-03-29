import fs from 'fs'
import yaml from 'js-yaml'
import { Mirai } from 'mirai-ts'
import type { MiraiApiHttpSetting, MessageType } from 'mirai-ts'
import logger from 'src/util/log'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import type * as types from 'src/types'


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
      if (messageHandler[i] instanceof BaseMessageHandler) {
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
  if (chain.filter(item => (
    (item.type === 'At' && item.target == config.botQQ) || 
    (item.type === 'Plain' && item.text.indexOf('@' + (config.botNickname??'_undef___')) >= 0))
  ).length > 0)
    return true
  else return false
}

class MiraiImpl extends types.TalkWrapper {
  protected _mirai?: Mirai

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
        if (e.sender?.memberName !== 'Q群管家') {
          handleMessage(e as MiraiBasicEvent)
        }
      }
    })

    mirai.on('MemberJoinEvent', async e => {
      if (e.member.id == config.botQQ) {
        return
      }

      if (dat + 30000 < dats()) {
        const ds = dats()
        handleMessage(e as MiraiBasicEvent)
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
    result.isAdmin = this.userId == config.adminQQ
    result.nickname = e.sender?.nickname
    result.group = (e.type === 'GroupMessage' ? e.sender.group : undefined)
    result.textMessage = e.messageChain?.filter(item => item.type === 'Plain').map(item => item.text).join().trim()??''
    if (!(e.isAt && e.isAt()) && !!config.botNickname) {
      result.textMessage = result.textMessage?.replaceAll('@' + config.botNickname, '')?.trim()??''
    }
    return result
  }

  /**
   * 会话Id
   */
  sessionId(e: any): number {
    return (e.type === 'GroupMessage') ? e.group.id : e.sender.id
  }

  /**
   * 回复消息
   */
  async reply(e: any, chain: TalkChain[], quote?: boolean = false): [ boolean, any ] {
    let result = await e.reply(chain, quote)
    let count = 3
    while (count > 0 && result.code == 500) {
      count --
      await delay(5000)
      result = await e.reply(chain, quote)
      if (config.debug)
        console.log('reply result code[500], retry ' + (3 - count) + ' ...', chain, result)
      if (result.code == 0)
        break
    }
    // 依旧失败则尝试发送图片的形式
    if(result.code == 500) {
      console.log(
        'retry fail, use `md2jpg` method: ',
        this._eventObject.messageChain
      )
      await delay(5000)
      const base64 = await md2jpg((await genTemplate(e.sender?.nickname, chain)))
      result = await e.reply([{ type: 'Image', base64 }])
    }
    return [ (result.code == 0), result ]
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

