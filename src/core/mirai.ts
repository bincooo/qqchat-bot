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
  mirai.on('message', e => {
    if ([ 'FriendMessage', 'TempMessage' ].includes(e.type) || (e.isAt && e.isAt())) {
      if (e.sender?.memberName !== 'Q群管家') {
        handleMessage(e as MiraiBasicEvent)
      }
    } else if(e.type === 'GroupMessage' && !!config.botNickname) {
      if (e.messageChain.filter(item => item.type === 'Plain' && item.text.indexOf('@' + config.botNickname) >= 0).length > 0) {
        handleMessage(e as MiraiBasicEvent)
      }
    }
    // console.log('mirai: ', e)
  })
  client = mirai
  mirai.api.sendFriendMessage('已上线~', config.adminQQ)
  mirai.listen()
}

export function getClient() {
  return client
}