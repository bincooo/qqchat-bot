import { MessageEvent, MessageHandler } from 'src/types'
import { getClient } from 'src/core/oicq'
import { config } from 'src/config'
import getClient from 'src/core'

export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  const replyMessage = (nickname: string): string => {
    return `ζ¬’θΏπΉπΉ ${nickname} ππε ε₯\n@${config.botNickname} /help ζζεε¦ ~ β¨`
  }
  switch (config.type) {
    case "mirai":
      if (e.type === 'MemberJoinEvent') {
        getClient()?.api.memberInfo(e.member.group.id, e.member.id)
          .then(i => {
            e.reply(replyMessage(i.memberName))
          })
        return false
      }
      break
    default:
      if (e.notice_type === 'group' && e.sub_type === 'increase') {
        e.group.sendMsg(replyMessage(e.nickname))
        return false
      }
      break
  }

  
  return true
}
