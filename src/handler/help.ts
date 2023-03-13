import { MessageEvent, MessageHandler } from 'src/types'
import { getClient } from 'src/core/oicq'
import { config } from 'src/config'


export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  const replyMessage = (nickname: string): string => {
    return `欢迎🌹🌹 ${nickname} 🎉🎉加入\n@${config.botNickname} /help 有惊喜哦 ~ ✨`
  }
  switch (config.type) {
    case "mirai":
      if (e.type === 'MemberJoinEvent') {
        mirai.api.memberInfo(e.member.id, e.member.group.id)
          .then(info => e.reply(replyMessage(info.name)))
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
