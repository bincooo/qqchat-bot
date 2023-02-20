import { MessageEvent, MessageHandler } from 'src/types'
import { buildHelpMessage } from 'src/command/commands/help'

export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  if (e.notice_type === 'group' && e.sub_type === 'increase') {
    try {
      e.group.sendMsg(buildHelpMessage(false, '欢迎 ' + e.nickname), false)
    } catch(err) {
      console.log('HelpHandler:Error', err)
    }
    return false
  }
  return true
}
