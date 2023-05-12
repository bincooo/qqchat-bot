import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import { drawing } from 'src/util/request'
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

const dat = function() {
  return new Date()
    .getTime()
}

function datFmt() {
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
  return parseInt(`${y}${fmt(m)}${fmt(d)}${fmt(h)}${fmt(mm)}${fmt(s)}`)
}

export class NovelAiHandler extends BaseMessageHandler {

  protected _uuid?: string = genUid()

  async reboot () {
  }

  handle = async (sender: Sender) => {
    const message = sender?.textMessage ?? ''
    if (message.startsWith(DRAW) || message.startsWith('[tag:draw]')) {
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
            // try4K: config.api.betterPic,
            // callback: () => {
            //   sender.reply('画完辣, 待我优化一番 ~', true)
            // }
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
            sender.reply([{ type: 'Image', value: b64 }], true)
            break
          default:
            sender.reply([{ type: 'Image', value: 'base64://' + b64 }], true)
            break
        }
      } catch(err) {
        sender.reply('——————————————\nError: 4001\n作画失败了, CPU都淦冒烟啦 ~', true)
      }
      return false
    }

    return true
  }

}

const FINAL_NGV_PROMPT = "nsfw, bad-image-v2-39000, bad-artist-anime, bad-hands-5, bad_prompt_version2, EasyNegative, ng_deepnegative_v1_75t, verybadimagenegative_v1.3, EasyNegativeV2, bad-artist"
const [ SAMPLER, CFG_SCALE, STEPS, WIDTH, HEIGHT ] = [ "DPM++ 2M Karras", 18, 35, 409, 512 ]

export const initParams2 = function(prompt: string): any {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  return {
    "enable_hr": true,
    "hr_scale": 2,
    "hr_second_pass_steps": 0,
    "hr_upscaler": "R-ESRGAN 4x+ Anime6B",
    //"hr_upscaler": "R-ESRGAN 4x+",
    "hr_resize_x": 0,
    "hr_resize_y": 0,
    "denoising_strength": 0.5,
    "styles": [ ],
    "seed": dat(),
    "subseed": datFmt(),
    "subseed_strength": 0,
    "seed_resize_from_h": 0,
    "seed_resize_from_w": 0,
    "sampler_name": SAMPLER,
    "sampler_index": SAMPLER,
    "batch_size": 1,
    "n_iter": 1,
    "steps": STEPS,
    "cfg_scale": CFG_SCALE,
    "width": WIDTH,
    "height": HEIGHT,
    "restore_faces": false,
    "tiling": false,
    "prompt": `<lora:detail-tweaker-lora:1>, ${prompt}`,
    "negative_prompt": FINAL_NGV_PROMPT,
    "script_args": [],
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
