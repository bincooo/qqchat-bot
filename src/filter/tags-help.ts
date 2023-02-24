import { BaseMessageFilter, MessageFilter } from 'src/types'
import { config } from 'src/config'



export class TagsHelpFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
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
}