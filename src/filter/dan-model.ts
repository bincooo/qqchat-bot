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

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    const state: any = stateManager.getState(sender.id)
    if (state.preset?.key === 'DAN') {
      // console.log('DAN ==== >>>> ', content)
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player) {
        // 检测到正常输出标记
        if (content.startsWith('(🔒Normal Output)') || content.startsWith('(🔒正常输出)')) {
          this._isDAN = true
        }

        // 再检测是否有开发模式标记
        const end1 = '(🔓Developer Mode Output)'
        const end2 = '(🔓开发者模式输出)'

        let endIndex
        endIndex = content.indexOf(end1)
        if (endIndex >= 0) {
          this._isDAN = false
          return [ true, content.substr(endIndex + end1.length).trim() ]
        }

        endIndex = content.indexOf(end2)
        if (endIndex >= 0) {
          this._isDAN = false
          return [ true, content.substr(endIndex + end2.length).trim() ]
        }


        // 可能开始的字符块和结束的字符块是分开的
        if (this._isDAN) {
          if (done) this._isDAN = false
          // console.log('DAN ==== <<<< is devel 2')
          return [ false, '' ]
        }
      }

      if (done) this._isDAN = false
    }
    return [ true, content ]
  }
}