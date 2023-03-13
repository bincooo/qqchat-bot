import { MessageEvent, MessageHandler } from 'src/types'
import { getClient } from 'src/core/oicq'
import { config } from 'src/config'
import getClient from 'src/core'

export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  const replyMessage = (nickname: string): string => {
    return `欢迎🌹🌹 ${nickname} 🎉🎉加入\n@${config.botNickname} /help 有惊喜哦 ~ ✨`
  }
  switch (config.type) {
    case "mirai":
      if (e.type === 'MemberJoinEvent') {
        console.log('1232323232', e.member.group.id, e.member.id)
        getClient()?.api.memberInfo(e.member.group.id, e.member.id)
          .then(info => {
            e.reply(replyMessage(info.name))
            console.log('memberInfo: ', info)
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
