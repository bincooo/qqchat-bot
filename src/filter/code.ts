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

    if (content.startsWith('[md]') || content.startsWith('[md:latex]')) {
      resultMessage = [
          (content.startsWith('[md:latex]') ? 'latex格式\n' : ''),
          '用我定义的格式回复，格式为```markdown [xx] ```，[xx]替换成你的回答：\n\n',
          content.substr(6)
        ]
      .join('\n')
      return [ false, resultMessage.trim() ]
    }

    return [ true, content ]
  }
}