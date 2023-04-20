import { BaseMessageFilter, MessageFilter } from 'src/types'
import { config, preset } from 'src/config'
import stateManager from 'src/util/state'
import { Sender } from 'src/model/sender'
import { cgptOnChangeAccount } from 'src/util/event'
import { NowAI } from 'src/util/config'

const DRAW: string = '/draw'
export class NovelAiFilter extends BaseMessageFilter {
  protected session: {
    conversationId?: string
    parentMessageId?: string
  } = {}

  constructor() {
    super()
    this.type = 0
    cgptOnChangeAccount(() => {
      this.session = {}
    })
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    if (content.startsWith('[tag]')
        && state.preset?.key 
        && preset.find(it => (
          it.key == state.preset.key 
          && !['DAN', 'Linux', '面试官', '工作表', '开发者顾问', 'IT工程师'].includes(it.key))
        )
    ) {
      sender.reply(`角色扮演【${state.preset.key}】时无法使用[tag] !`)
      return [ false, '' ]
    }

    let resultMessage = ''
    const { novelAiHelper }  = preset
    if (content.startsWith(DRAW)) {
      return [ false, content.substr(DRAW.length) ]
    }
    if (content.startsWith('[tag]')) {
      if (novelAiHelper) {
        resultMessage = novelAiHelper.indexOf('[!!content!!]') >= 0 ? 
          novelAiHelper.replaceAll('[!!content!!]', content.substr(5)) :
          novelAiHelper.concat(content.substr(5))
      } else resultMessage = content.substr(5)
      return [ false, resultMessage.trim() ]
    }

    if (content.startsWith('[tag:draw]')) {
      if (novelAiHelper) {
        resultMessage = novelAiHelper.indexOf('[!!content!!]') >= 0 ? 
          novelAiHelper.replaceAll('[!!content!!]', content.substr(10)) :
          novelAiHelper.concat(content.substr(10))
        let result = null
        const AI = NowAI()
        switch(AI) {
        case "Claude":
          if (!this.session?.channel)
            this.session?.channel = await config.chatApi.newChannel('chat-' + config.botQQ)
          result = await config.chatApi.sendMessage({ text: resultMessage, ...this.session })
          this.session.conversationId = result?.conversationId
          break
        default: // WebGPT
          result = await config.chatApi.sendMessage(resultMessage, { ...this.session })
          this.session.parentMessageId = result?.id
          this.session.conversationId = result?.conversationId
          break
        }
        console.log('noval-ai [tag:draw] ===== >>>> ', result)

        const prompt = result.text
          .replaceAll('，', ',')
          .replaceAll(' ', '-')
          .match(/[a-zA-Z0-9,{}\[\]-]/g)
          .join('')
          .replaceAll('-', ' ')
          .split(',')
          .map(it => it.trim())
          .filter(it => !!it)
          .join(', ')

        if (prompt) {
          return [ false, prompt ]
        }
      } else return [ false, resultMessage ]
    }
    return [ true, content ]
  }
}