import { BaseMessageFilter, MessageFilter } from 'src/types'
import { preset } from 'src/config'


const DRAW: string = '/draw'
export class NovelAiFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
    let resultMessage = ''
    const { novelAiHelper }  = preset
    if (content.startsWith(DRAW)) {
      return [ false, content.substr(DRAW.length) ]
    }
    if (content.startsWith('[tag]')) {
      if (novelAiHelper) {
        resultMessage = novelAiHelper.indexOf('[!!content!!]') >= 0 ? 
          novelAiHelper.replace('[!!content!!]', content.substr(5)) :
          novelAiHelper.concat(content.substr(5))
      } else resultMessage = content.substr(5)
      return [ false, resultMessage.trim() ]
    }

    return [ true, content ]
  }
}