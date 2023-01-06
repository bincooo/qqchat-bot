import { config } from 'src/config'
import messageHandlers from 'src/handler'
import { ChatGPTOfficialHandler } from 'src/handler/chatgpt-official'
import { writeConfig } from 'src/util/config'
import { Sender } from '../../model/sender'
import { BaseCommand } from '../command'

async function reloadConfig (key: string, value: any) {
  const handler = messageHandlers.find(item => item instanceof ChatGPTOfficialHandler) as ChatGPTOfficialHandler
  if (!handler) return
  if (!config.officialAPI[key]) {
    throw Error(`没有 officialAPI.[${key}] 配置项`)
  }
  config.officialAPI[key] = value
  handler.load()
  await writeConfig(config)
}

class OfficialCommand extends BaseCommand {
  label = 'official'
  usage = [
    'get // 获取当前配置',
    'key [key] // 设置 key',
    'model [model] // 设置 model',
    'maxTrackCount [count] // 设置会话跟踪上限',
    'identity [identity] // 设置人格（使用==连接多个）',
    'maxTokens [n] // 设置回复消息占用token',
    'maxTrackCount [n] // 设置最大记忆对话次数',
    'temperature [0-1] // 设置回答问题的概率系数 0-1',
    'stop [Q, A] // 设置问答名称，使用==连接 Humen==AI'
    // 'prop [key] [value] // 设置配置项'
  ]

  requiredAdministrator = true

  description = '官方api配置'

  async execute (sender: Sender, params: string[]) {
    switch (params[0]) {
      case 'get':
        sender.reply(JSON.stringify(config.officialAPI, null, 2))
        break
      case 'key':
      case 'stop':
      case 'model':
      case 'identity':
      case 'maxTokens':
      case 'temperature':
      case 'maxTrackCount':
        if (params[0] === 'identity' ||
          params[0] === 'stop') {
          await reloadConfig(params[0], params[1]?.split('==') ?? [])
        } else {
          await reloadConfig(params[0], params[1])
        }
        sender.reply(`${params[0]}重置成功!`)
        break
      default:
        sender.reply(this.helpDoc, true)
    }
  }
}

export default OfficialCommand
