import { MessageHandler } from 'src/types'
import { config } from 'src/config'
import getClient from 'src/core'

export const helpHandler: MessageHandler = function (sender) {
  const e: any = sender.getEvent()
  const replyMessage = (nickname: string): string => {
    return `欢迎🌹🌹 ${nickname} 🎉🎉加入\n@${config.botNickname} /help 有惊喜哦 ~ ✨`
  }
  switch (config.type) {
    case "mirai":
      if (e.type === 'MemberJoinEvent') {
        getClient().target.api.memberInfo(e.member.group.id, e.member.id)
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
