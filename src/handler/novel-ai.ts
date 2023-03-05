import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import { mccnProDraw, mccnProReboot } from 'src/util/request'
import { filterTokens } from 'src/util/message'
import { segment } from 'oicq'
import retry from 'src/util/retry'
import { randomBytes } from 'crypto'
import { config } from 'src/config'



const DRAW: string = '/draw'
const hint = [
  "正在努力作画, 稍等哦~",
  "在画了在画了, 别急呢~",
  "本Ai要当一个敲腻害的画家~",
  "呀咩, 奇怪的作画要求哦~",
  "急死Ai了, 又要人家画画!!",
  "好吧好吧, 马上给您画 >_<|||"
]


function genUid(len?: number = 11): string {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
    .substr(0, len)
}

export class NovelAiHandler extends BaseMessageHandler {

  protected _uuid?: string = genUid()

  async reboot () {
  }

  handle = async (sender: Sender) => {
    if ((sender?.textMessage||'').startsWith(DRAW)) {
      const idx = parseInt(Math.random() * hint.length, 10)
      sender.reply(hint[idx], true)

      const data = initParams(
        (await filterTokens(sender?.textMessage.substr(DRAW.length), sender))
      )
      try {
        const path  = await retry(
          () => mccnProDraw({
            data,
            session_hash: this._uuid,
            try4K: config.api.betterPic,
            callback: () => {
              sender.reply('画完辣, 待我优化一番 ~', true)
            }
          }),
          3,
          500
        )

        sender.reply(segment.image(path), true)
      } catch(err) {
        sender.reply('——————————————\nError: 4001\n作画失败了, CPU都淦冒烟啦 ~', true)
        await this.reset()
      }
      return false
    }

    return true
  }

  async reset() {
    try {
      this._uuid = genUid()
      await mccnProReboot()
    } catch(err) {
      console.error(err)
    }
  }

}

// 提示词参考: https://www.yuque.com/longyuye/lmgcwy
export const initParams = function(prompt: string): Array<any> {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  // 提示词相关性(CFG Scale)
  const cfg_scale = 6,
    [ width, height ] = [ 512, 832 ]
  return [
        `task(${genUid(15)})`,
        prompt,
        "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, bad hands, bad anatomy, {{{{{bare flesh}}}}}",
        [],
        20,
        "Euler a",
        false,
        false,
        1,
        1,
        cfg_scale,
        -1,
        -1,
        0,
        0,
        0,
        false,
        height,
        width,
        false,
        0.7,
        2,
        "Latent",
        0,
        0,
        0,
        [],
        "None",
        false,
        false,
        "LoRA",
        "None",
        1,
        1,
        "LoRA",
        "None",
        1,
        1,
        "LoRA",
        "None",
        1,
        1,
        "LoRA",
        "None",
        1,
        1,
        "LoRA",
        "None",
        1,
        1,
        "Refresh models",
        null,
        false,
        "none",
        "None",
        1,
        null,
        false,
        "Scale to Fit (Inner Fit)",
        false,
        false,
        64,
        64,
        64,
        0,
        1,
        false,
        false,
        false,
        "positive",
        "comma",
        0,
        false,
        false,
        "",
        "Seed",
        "",
        "Nothing",
        "",
        "Nothing",
        "",
        true,
        false,
        false,
        false,
        0,
        null,
        50
    ]
}


const str = function(json: any) {
  return JSON.stringify(json)
}

const dat = function() {
  const inst = new Date()
  const y = inst.getFullYear()
  const m = inst.getMonth()+1
  const d = inst.getDate()
  const h = inst.getHours()+1
  const mm = inst.getMinutes()
  const s = inst.getSeconds()
  const fmt = (n: number) => {
    return (n < 10 ? '0' + n : n)
  }
  return `${y}${fmt(m)}${fmt(d)}${fmt(h)}${fmt(mm)}${fmt(s)}00`
}