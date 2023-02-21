import { BaseMessageFilter, MessageFilter } from 'src/types'

const replaceMapping = {
  '，': ',',
  '！': '!',
  '。': '.',
  '？': '?'
}

// export const symbolFilter: MessageFilter = function (content: string) {
//   let resultMessage = ''
//   for (let i = 0; i < content.length; i++) {
//     if (resultMessage.at(-1) === content[i]) {
//       if (content[i] === ' ') continue
//     }
//     if (replaceMapping[content[i]] !== undefined) {
//       resultMessage += replaceMapping[content[i]] as string
//     } else {
//       resultMessage += content[i]
//     }
//   }
//   return [ true, resultMessage.trim() ]
// }

export class SymbolFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
    let resultMessage = ''
    for (let i = 0; i < content.length; i++) {
      if (resultMessage.at(-1) === content[i]) {
        if (content[i] === ' ') continue
      }
      if (replaceMapping[content[i]] !== undefined) {
        resultMessage += replaceMapping[content[i]] as string
      } else {
        resultMessage += content[i]
      }
    }
    return [ true, resultMessage.trim() ]
  }
}