import { onlineSearch } from 'src/util/request'
import { BaseMessageFilter } from 'src/types'
import { config } from 'src/config'

const FINAL_STR = "[online]"
export class DefaultFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
    let resultMessage = ''
    if (content.startsWith(FINAL_STR)) {
      resultMessage = content.substr(FINAL_STR.length)
      try {
        const result = onlineSearch(resultMessage)
        if (config.debug) {
          console.log('online search results: ', result)
        }
        return [
          false,
          [
            result.map((item, index) => `[${index+1}]"${item.body}"\nURL:${item.href}`).join('\n\n'),
            "Instructions: Using the provided web search results, write a comprehensive reply to the given query. Make sure to cite results using [[number](URL)] notation after the reference. If the provided search results refer to multiple subjects with the same name, write separate answers for each subject.",
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