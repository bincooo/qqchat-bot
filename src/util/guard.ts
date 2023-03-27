import { preset, config } from 'src/config'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'
import { preset } from 'src/config'
import { cgptOnChangeAccount } from 'src/util/event'

const filters = [
    "ai",
    "model",
    "人工智能"
  ]

class GuardAi {

  protected session: {
    conversationId?: string
    parentMessageId?: string
  } = {}

  constructor() {
    cgptOnChangeAccount(() => {
      this.session = {}
    })
  }

  check = async (content: string, sender?: Sender) => {
    if (content.trim().length <= 5) {
      return true
    }
    const state: any = stateManager.getState(sender.id)
    if (!!state.preset?.key) {
      const value = content?.toLocaleLowerCase() ?? ""
      const condition = filters.find(item => value.includes(item))
      if (condition) {
        sender.reply('发了什么奇奇怪怪的消息, 麻烦你爬好吗 (╯‵□′)╯︵┻━┻', true)
        return false
      }
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player && player.maintenance?.guard) {
        const prompt = player.maintenance.guard.replace('[!!content!!]', content)
        const result = await state.chatApi.sendMessage(prompt, { ...this.session })
        console.log('GuardAi ===== >>>> ', result)
        this.session.parentMessageId = result.messageId
        this.session.conversationId = result.conversationId
        if (result.response && (result.response.toLocaleLowerCase().includes('yes'))) {
          sender.reply('发了什么奇奇怪怪的消息, 麻烦你爬好吗 (╯‵□′)╯︵┻━┻', true)
          return false 
        }
      }
    }
    return true
  }
}

export default new GuardAi()