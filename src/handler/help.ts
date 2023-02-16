import { MessageEvent, MessageHandler } from 'src/types'
import { buildHelpMessage } from 'src/command/commands/help'

export const helpHandler: MessageHandler = function (sender) {
  const e: MessageEvent = sender.getEventObject()
  if (e.notice_type === 'group' && e.sub_type === 'increase') {
    try {
      e.group.sendMsg('欢迎'+e.nickname+'加入, @小爱Ai+[文本] 即可与Ai对话哦~\n\n' + buildHelpMessage(false), false)
    } catch(err) {
      console.log('helpHandler err: ', err)
    }
    return false
  }
  return true
}
