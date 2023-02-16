import { MessageHandler } from 'src/types'
import { buildHelpMessage } from 'src/command/commands/help'

export const helpHandler: MessageHandler = function (sender) {
  if (sender?.textMessage === 'help') {
    sender.reply('欢迎新人加入, @小爱Ai+[文本] 即可与Ai对话哦~\n\n' + buildHelpMessage(false), true)
    return false
  }
  return true
}
