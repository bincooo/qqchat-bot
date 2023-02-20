import { MessageFilter } from 'src/types'
import { config } from 'src/config'

export const tagsHelpFilter: MessageFilter = function (content: string) {
  let resultMessage = ''
  const { tagsHelper } = config.api
  if (content.startsWith('[prompt]')) {
    resultMessage = [
        tagsHelper,
        content.substr(8),
        '\n仅需要给我提供prompt的内容'
      ]
    .join('\n')
    return [ false, resultMessage.trim() ]
  }

  return [ true, content ]
}