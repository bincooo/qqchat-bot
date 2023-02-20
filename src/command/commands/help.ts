import { segment } from 'oicq'
import commands from '.'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import { getClient } from 'src/core/oicq'

export function buildHelpMessage (isAdmin: boolean, title?: string) {
  const command = commands.filter(item => {
    // const hasPermission = item.requiredAdministrator ? isAdmin : true
    return item.label !== 'help' /* && hasPermission */ && item.showHelp()
  })

  const content = command.map((item, key) => `${(key + 1)}: ${item.helpDoc}`).join('\n————————————————\n')
  // return [
  //   '———————',
  //   '命令帮助',
  //   '———————',
  //   content
  // ].join('\n')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <msg serviceID="1">
    <item layout="6">
        ${!title ? '' : '<title>' + title + '</title>'}
        <summary>\n\n@小爱Ai + [文本 or 命令]\n! ! !  即可与Ai对话哦 ~\n———————\n命令帮助\n———————\n${content}</summary>
    </item>
  </msg>`
}

class HelpCommand extends BaseCommand {
  label = 'help'
  usage = []
  description = '帮助'
  requiredAdministrator = false
  execute (sender: Sender, params: string[]) {
    const replyMessage = buildHelpMessage(sender.isAdmin)
    sender.reply(segment.xml(replyMessage))
  }
}

export default HelpCommand
