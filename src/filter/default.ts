import { BaseMessageFilter } from 'src/types'
import { preset, config } from 'src/config'



export class DefaultFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string) => {
    if (!!preset.default) {
      const result = preset.default
        .replace('[!!date!!]', dat())
        .replace('[!!content!!]', content)
      return [ true, result ]
    }
    return [ true, content ]
  }
}

function dat() {
  const ts = new Date()
    .getTime()
  const date = new Date(ts + 1000 * 60 * 60 * 8)
  const y = inst.getFullYear()
  const m = inst.getMonth()+1
  const d = inst.getDate()
  const h = inst.getHours()+1
  const mm = inst.getMinutes()
  const s = inst.getSeconds()
  const fmt = (n: number) => {
    return (n < 10 ? '0' + n : n)
  }
  return `${y}-${fmt(m)}-${fmt(d)} ${fmt(h)}:${fmt(mm)}:${fmt(s)}`
}