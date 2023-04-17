import { preset } from 'src/config'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'
import { nowAi } from 'src/util/config'


export function buildHelpMessage () {
  const player = preset.player??[]
  const ai = nowAi()
  return [ ...player.filter(item => {
    console.log('???????', item)
    return !item.type.find(it => it === ai)
  }).map((item, index) => `${index+1}. ${item.key}`) ]
}

class PlayerCommand extends BaseCommand {
  label = 'player'
  usage = [
    `help   - 查看角色扮演帮助信息`
  ]

  requiredAdministrator = false
  description = 'web chatgpt 配置'

  async execute (sender: Sender, params: string[]) {
    switch (params[0]) {
      case 'help':
        sender.reply(
          [{
            type: 'Plain',
            value: [
              'Used:\n开启 [名称]\n例子: 开启 喵小爱\n',
              ...buildHelpMessage()
            ].join('\n')
          }], false)
        break
      default:
        sender.reply([ { type: 'Plain', value: this.helpDoc } ], true)
        break
    }
  }
}

export default PlayerCommand
