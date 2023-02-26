import { BaseMessageFilter, MessageFilter } from 'src/types'
import { config } from 'src/config'



export class CodeFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
    let resultMessage = ''
    const { tagsHelper } = config.api
    if (content.startsWith('[code]')) {
      resultMessage = [
          content.substr(6),
          '\n; 如果篇幅过长，必须截断成多个代码块分多个阶段回复，这很重要，务必遵循!'
        ]
      .join('\n')
      return [ false, resultMessage.trim() ]
    }

    return [ true, content ]
  }
}