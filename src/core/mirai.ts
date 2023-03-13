/// <reference path="mirai-ts" />
import fs from 'fs'
import yaml from 'js-yaml'
import { Mirai, MessageType } from 'mirai-ts'
import type { MiraiApiHttpSetting } from 'mirai-ts'
import logger from 'src/util/log'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler, MessageHandler, MiraiBasicEvent } from 'src/types'


let client: Mirai
let messageHandler: Array<MessageHandler | BaseMessageHandler>

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
        isStop = !await (messageHandler[i] as BaseMessageHandler).handle(sender)
      } else if (typeof messageHandler[i] === 'function') {
        isStop = !await (messageHandler[i] as MessageHandler)(sender)
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

export async function initMirai(initMessageHandler?: Array<MessageHandler | BaseMessageHandler>) {
  messageHandler = initMessageHandler ?? messageHandler ?? []
  const { yaml: yamlConfig } = config.mirai
  const setting: MiraiApiHttpSetting = yaml.load(fs.readFileSync(yamlConfig, 'utf8'))
  const mirai = new Mirai(setting)
  await mirai.link(config.botQQ)
  let dat: number  = 0
  const isAtme = function(chain: (any)[]) {
    if (chain.filter(item => (
      (item.type === 'At' && item.target == config.botQQ) || 
      (item.type === 'Plain' && item.text.indexOf('@' + config.botNickname??'undef') >= 0))
    ).length > 0)
      return true
    else return false
  }
  mirai.on('message', e => {
    // console.log('on message: ', isAtme(e.messageChain))
    if ([ 'FriendMessage', 'TempMessage' ].includes(e.type) || (e.type === 'GroupMessage' && isAtme(e.messageChain))) {
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
  client = mirai
  mirai.api.sendFriendMessage('已上线~', config.adminQQ)
  mirai.listen()
}

export function getClient() {
  return client
}