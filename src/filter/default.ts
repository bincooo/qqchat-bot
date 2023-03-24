import { BaseMessageFilter } from 'src/types'
import { preset, config } from 'src/config'
import { Sender } from 'src/model/sender'


export class DefaultFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string, sender?: Sender) => {
    if (!!preset.default) {
      let result = preset.default
        .replace('[!!date!!]', dat())
      if (result.includes('[!!content!!]')) {
        result = result.replace('[!!content!!]', content)
          .replace('[!!name!!]', sender?.nickname)
          .replace('\\n', '\n')
        return [ true, result ]
      }
      return [ true, result + content ]
    }
    return [ true, content ]
  }
}

function dat() {
  const ts = new Date()
    .getTime()
  const date = new Date(ts + 1000 * 60 * 60 * 7)
  const y = date.getFullYear()
  const m = date.getMonth()+1
  const d = date.getDate()
  const h = date.getHours()+1
  const mm = date.getMinutes()
  const s = date.getSeconds()
  const fmt = (n: number) => {
    return (n < 10 ? '0' + n : n)
  }
  return `${y}-${fmt(m)}-${fmt(d)} ${fmt(h)}:${fmt(mm)}:${fmt(s)}`
}