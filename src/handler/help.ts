import { MessageEvent, MessageHandler } from 'src/types'
import { buildHelpMessage } from 'src/command/commands/help'

export const helpHandler: MessageHandler = function (sender) {
  const event: MessageEvent = sender.getEventObject()
  if (event.notice_type === 'group' && event.sub_type === 'increase') {
    sender.reply('欢迎新人加入, @小爱Ai+[文本] 即可与Ai对话哦~\n\n' + buildHelpMessage(false), true)
    return false
  }
  return true
}
