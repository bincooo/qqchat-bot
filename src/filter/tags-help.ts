import { MessageFilter } from 'src/types'
import { config } from 'config'

export const tagsHelpFilter: MessageFilter = function (content: string) {
  let resultMessage = ''
  const { tagsHelper } = config.api
  if (content.startsWith('[prompt]')) {
    resultMessage = [
        tagsHelper,
        sender.textMessage.substr(8),
        '\n仅需要给我提供prompt的内容'
      ]
    .join('\n')
    return [ false, resultMessage.trim() ]
  }

  return [ true, content ]
}