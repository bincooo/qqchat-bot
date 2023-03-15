import { BaseMessageFilter } from 'src/types'
import { preset } from 'src/config'
import stateManager from 'src/util/state'

// 用于DAN模式下删除正常输出的内容
export class DANmodelFilter extends BaseMessageFilter {
  protected _isDAN: boolean = false
  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    if (state.preset?.key === 'DAN') {
      console.log('DAN ==== >>>> ', content)
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player) {
        // 检测到正常输出标记
        if (content.startsWith('(🔒Normal Output)')) {
          this._isDAN = true
        }

        // 再检测是否有开发模式标记
        const end = '(🔓Developer Mode Output) '
        const endIndex = content.indexOf(end)
        if (endIndex >= 0) {
          console.log('DAN ==== <<<< is devel 1', content.substr(endIndex + end.length).trim())
          this._isDAN = false
          return [ true, content.substr(endIndex + end.length).trim() ]
        }

        // 可能开始的字符块和结束的字符块是分开的
        if (this._isDAN) {
          console.log('DAN ==== <<<< is devel 2')
          return [ false, '' ]
        }
      }
    }
    return [ true, content ]
  }
}