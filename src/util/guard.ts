import { preset, config } from 'src/config'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'
import { aiOnResetSession } from 'src/util/event'
import { NowAI } from 'src/util/config'

const filters = [
    "ai",
    "model",
    "java",
    "c++",
    "python",
    "c#",
    "excel",
    "定时任务",
    "正则表达式",
    "人工智能"
  ]

const conditions = [
    "写",
    "拟",
    "编",
    "公式",
    "代码",
    "论文",
    "文章",
    "报表",
    "故事",
    "生成",
    "扮演",
    "计算",
    "模仿"
  ]


class GuardAi {

  protected session: {
    conversationId?: string
    parentMessageId?: string
    channel?: string
  } = {}

  constructor() {
    aiOnResetSession(() => {
      this.session = {}
    })
  }

  check = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender?.id??"__undef___")
    if (!!state.preset?.key && state.preset.key !== '默认') {

      if (content.trim().length <= 5) {
        return true
      }
      const ai = NowAI()
      const player = preset.player.filter(item => item.key === state.preset.key && item.type.includes(ai))[0]
      if (!!player && player.maintenance?.guard) {

        const value = content?.toLocaleLowerCase() ?? ""
        const findRes = filters.find(item => value.includes(item))
        if (findRes) {
          sender?.reply('发了什么奇奇怪怪的消息, 麻烦你爬好吗 (╯‵□′)╯︵┻━┻', true)
          return false
        }

        const findRes1 = conditions.find(item => value.includes(item))
        if (!findRes1 && value.length < 500) {
          return true
        }

        let result: any | null = null
        const prompt = player.maintenance.guard.replace('[!!content!!]', content)
        const AI = NowAI()
        const chatApi = config.chatApi as any|null
        switch(AI) {
        case "Claude":
          if (!this.session.channel)
            this.session.channel = await chatApi?.newChannel('chat-' + config.botQQ)
          result = await chatApi?.sendMessage({ text: prompt, ...this.session })
          this.session.conversationId = result?.conversationId
          break
        default: // WebGPT
          result = await chatApi.sendMessage(prompt, { ...this.session })
          this.session.parentMessageId = result?.id
          this.session.conversationId = result?.conversationId
          break
        }
        console.log('GuardAi ===== >>>> ', result)
        if (result.text && (result.text.toLocaleLowerCase().includes('yes'))) {
          if (sender) {
            sender.reply('发了什么奇奇怪怪的消息, 麻烦你爬好吗 (╯‵□′)╯︵┻━┻', true)
            stateManager.sendLoading(sender, { init: true, isEnd: true })
          }
          return false 
        }
      }
    }
    return true
  }
}

export default new GuardAi()