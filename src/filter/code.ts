import { BaseMessageFilter, MessageFilter } from 'src/types'
import { QueueReply } from 'cgpt'
import stateManager from 'src/util/state'
import { Sender } from 'src/model/sender'

export class CodeFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string, sender?: Sender) => {
    let resultMessage = ''
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
          (content.startsWith('[md:latex]') ? '数学公式使用latex格式。' : ''),
          '在本次回复中你需要在开头加上“[markdown]”，举个例子：“[markdown] 很高兴为你服务”。\n理解以上内容并以markdown形式回答：\n',
          content.replace('[md]', '')
            .replace('[md:latex]', '')
        ]
      .join('\n')

      // console.log("CodeFilter ===> search images", content, content.match(/来[0-9]?张[^图片]{0,}图片/g))
      if (content.match(/来[0-9]?张[^图片]{0,}图片/g)) {
        const result: QueueReply = async (reply, onProgress) => {
          await reply('从现在起, 当你想发送一张照片时，请使用 Markdown ,并且 不要有反斜线, 不要用代码块。使用 Unsplash API (https://source.unsplash.com/1280x720/? < PUT YOUR QUERY HERE >)。如果你明白了，请回复“明白”')
          return reply( resultMessage.trim(), onProgress )
        }
        return [ false, result ]
      }

      return [ false, resultMessage.trim() ]
    }

    return [ true, content ]
  }
}