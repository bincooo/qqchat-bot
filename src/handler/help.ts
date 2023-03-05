import { MessageEvent, MessageHandler } from 'src/types'
import { getClient } from 'src/core/oicq'


export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  if (e.notice_type === 'group' && e.sub_type === 'increase') {
    e.group.sendMsg('欢迎🌹🌹' + e.nickname + '🎉🎉加入\n@' + config.botNickname + ' /help 有惊喜哦 ~ ✨', false)
    return false
  }
  return true
}
