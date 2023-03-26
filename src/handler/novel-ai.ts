import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import { drawing, mccnProDraw, mccnProReboot } from 'src/util/request'
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

      // const data = initParams(
      //   (await filterTokens(sender?.textMessage, sender))
      // )
      const data = initParams2(
        (await filterTokens(sender?.textMessage, sender))
      )
      try {
        const b64 = await retry(
          () => drawing({
            data,
            try4K: config.api.betterPic,
            callback: () => {
              sender.reply('画完辣, 待我优化一番 ~', true)
            }
          }),
          // () => mccnProDraw({
          //   data,
          //   session_hash: this._uuid,
          //   try4K: config.api.betterPic,
          //   callback: () => {
          //     sender.reply('画完辣, 待我优化一番 ~', true)
          //   }
          // }),
          3,
          500
        )
        switch (config.type) {
          case "mirai":
            sender.reply([{ type: 'Image', base64: b64 }], true)
            break
          default:
            sender.reply(segment.image('base64://' + b64), true)
            break
        }
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

const FINAL_NGV_PROMPT = "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, bad hands, bad anatomy, {{{{{bare flesh}}}}}"
const [ CFG_SCALE, WIDTH, HEIGHT ] = [ 7, 512, 832 ] //[ 7, 768, 1024 ]

export const initParams2 = function(prompt: string): any {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  return {
    "enable_hr": false,
    "denoising_strength": 0,
    "firstphase_width": 0,
    "firstphase_height": 0,
    "hr_scale": 2,
    "hr_upscaler": null,
    "hr_second_pass_steps": 0,
    "hr_resize_x": 0,
    "hr_resize_y": 0,
    "styles": [ ],
    "seed": -1,
    "subseed": -1,
    "subseed_strength": -1,
    "seed_resize_from_h": -1,
    "seed_resize_from_w": -1,
    "sampler_name": "Euler a",
    "batch_size": 1,
    "n_iter": 1,
    "steps": 30,
    "cfg_scale": CFG_SCALE,
    "width": WIDTH,
    "height": HEIGHT,
    "restore_faces": false,
    "tiling": false,
    "prompt": prompt,
    "negative_prompt": FINAL_NGV_PROMPT,
    "eta": 0.667,
    "s_churn": 0,
    "s_tmax": 0,
    "s_tmin": 0,
    "s_noise": 1,
    "override_settings": {},
    "override_settings_restore_afterwards": true,
    "script_args": [],
    "sampler_index": "Euler a",
    "script_name": null
  }
}

// 提示词参考: https://www.yuque.com/longyuye/lmgcwy
export const initParams = function(prompt: string): Array<any> {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  // 提示词相关性(CFG Scale)
  return [
    `task(${genUid(15)})`,
    prompt,
    FINAL_NGV_PROMPT,
    [],
    20,
    "Euler a",
    false,
    false,
    1,
    1,
    CFG_SCALE,
    -1,
    -1,
    0,
    0,
    0,
    false,
    HEIGHT,
    WIDTH,
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
    null,
    "Refresh models",
    null,
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
    50,
    [],
    "",
    "",
    ""
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