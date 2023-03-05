import { onlineSearch } from 'src/util/request'
import { BaseMessageFilter } from 'src/types'
import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'

const FINAL_STR = "[online]"
export class OnlineFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string, sender?: Sender) => {
    let resultMessage = ''
    if (content.startsWith(FINAL_STR)) {
      resultMessage = content.substr(FINAL_STR.length)
      try {
        stateManager.sendLoading(sender, { init: true, isEnd: false })
        const result = await onlineSearch(resultMessage)
        if (config.debug) {
          console.log('online search results: ', result)
        }
        return [
          false,
          [
            "Web search results:\n",
            result.map((item, index) => `[${index+1}] "${item.body}"\nURL:${item.href}`).join('\n\n'),
            "\n\n Instructions: Using the provided web search results, write a comprehensive reply to the given query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject.",
            `Query: ${resultMessage}`,
            "Reply in 中文"
          ].join('\n')
        ]
      } catch(err) {
        return [ false, resultMessage ]
      }
    }
    return [ true, content ]
  }
}