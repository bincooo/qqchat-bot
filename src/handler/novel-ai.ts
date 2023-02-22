import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import { draw, reset } from 'src/util/draw'
import { filterTokens } from 'src/util/message'
import { segment } from 'oicq'
import retry from 'src/util/retry'
import { randomBytes } from 'crypto'
import { config } from 'src/config'



const pref = '/draw'
const hint = [
  "正在努力作画, 稍等哦~",
  "在画了在画了, 别急呢~",
  "本Ai要当一个敲腻害的画家~",
  "呀咩, 奇怪的作画要求哦~",
  "急死Ai了, 又要人家画画!!",
  "好吧好吧, 马上给您画 >_<|||"
]


function genUid(): string {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
    .substr(0, 10)
}

export class NovelAiHandler extends BaseMessageHandler {

  protected _uuid?: string = genUid()

  async reboot () {
  }

  handle = async (sender: Sender) => {
    if ((sender?.textMessage||'').startsWith(pref)) {
      const idx = parseInt(Math.random() * hint.length, 10)
      sender.reply(hint[idx], true)

      const data = initParams(
        (await filterTokens(sender?.textMessage.substr(pref.length)))
      )

      retry(
        () => draw({
          data,
          session_hash: this._uuid,
          try4K: config.api.betterPic,
          callback: () => {
            sender.reply('画完辣, 待我优化一番 ~', true)
          }
        }),
        3,
        500
      ).then(path => {
        sender.reply(segment.image(path), true)
      })
      .catch(err => {
        sender.reply('——————————————\nError: 4001\n作画失败了, CPU都淦冒烟啦 ~', true)
        this.reset()
      })
      return false
    }

    return true
  }

  reset() {
    reset(this._uuid)
    this._uuid = genUid()
  }

}

// 提示词参考: https://www.yuque.com/longyuye/lmgcwy
export const initParams = function(prompt: string): Array<any> {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  // 提示词相关性(CFG Scale)
  const cfg_scale = 6.5,
    [ width, height ] = [ 512, 832 ]
  const params = [
    prompt + ", {{{by famous artist}}}, beautiful, masterpiece, medium butt, good lighting, {{by wadim kashin}}, {water droplets on face} , flowing hair, glossy hair, {{super detailed skin}}, detailed, zoom in on eyes, hydrous eyes",
    "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, bad hands, bad anatomy, {{{{{bare flesh}}}}}",
    "None",
    "None",
    28,
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
    true,
    0.7,
    0,
    0,
    "None",
    0.9,
    5,
    "0.0001",
    false,
    "None",
    "",
    0.1,
    false,
    false,
    false,
    false,
    "",
    "Seed",
    "",
    "Nothing",
    "",
    true,
    false,
    false,
    null
  ]

  return [...params, str({
    "prompt": params[0],
    "all_prompts": [
      params[0]
    ],
    "negative_prompt": params[1],
    "all_negative_prompts": [
      params[1]
    ],
    "seed": 1637418386,
    "all_seeds": [
      1637418386
    ],
    "subseed": 233106276,
    "all_subseeds": [
      233106276
    ],
    "subseed_strength": 0,
    "width": width,
    "height": height,
    "sampler_name": "Euler a",
    "cfg_scale": cfg_scale,
    "steps": 28,
    "batch_size": 1,
    "restore_faces": false,
    "face_restoration_model": null,
    "sd_model_hash": "0b16241c",
    "seed_resize_from_w": 0,
    "seed_resize_from_h": 0,
    "denoising_strength": 0.7,
    "extra_generation_params": {
      "First pass size": "0x0"
    },
    "index_of_first_image": 0,
    "infotexts": [
      `${params[0]}\nNegative prompt: ${params[1]}\nSteps: 28, Sampler: Euler a, CFG scale: ${cfg_scale}, Seed: 1637418386, Size: ${width}x${height}, Model hash: 0b16241c, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, First pass size: 0x0`
    ],
    "styles": [
      "None",
      "None"
    ],
    "job_timestamp": dat(),
    "clip_skip": 2,
    "is_using_inpainting_conditioning": false
  })]
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