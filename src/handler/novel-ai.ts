import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { draw } from 'src/util/draw'
import { filterTokens } from 'src/util/message'
import { segment } from 'oicq'

const pref = '/draw'
const hint = [
  "正在努力作画, 稍等哦~",
  "在画了再画了, 别急呢~",
  "本Ai要当一个敲腻害的画家~",
  "呀咩, 奇怪的作画要求哦~",
  "急死Ai了, 又要人家画画!!",
  "好吧好吧, 马上给您画 >_<|||"
]

export class NovelAiHandler extends BaseMessageHandler {


  async reboot () {
  }

  handle = async (sender: Sender) => {
    if ((sender?.textMessage||'').startsWith(pref)) {
      const idx = parseInt(Math.random() * hint.length, 10)
      sender.reply(hint[idx], true)

      const data = initParams(
        filterTokens(sender?.textMessage.substr(pref.length))
          .trim()
      )
      draw({ data })
        .then(path => {
          sender.reply(segment.image(path), true)
        })
        .catch(err => {
          sender.reply(`发生错误\n${err}`, true)
          console.log('NovelAI:Error', err)
        })
      return false
    }

    return true
  }

}

// 提示词参考: https://www.yuque.com/longyuye/lmgcwy
export const initParams = function(prompt: string): Array<any> {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  const params = [
    prompt + ", {{{{by famous artist}}}, beautiful, masterpiece, reflective hair, medium butt, good lighting, {{looking at you}}, focus on face, {{{{by wadim kashin}}}}, {{{{ray tracing}}}}, {{water droplets on face}} , flowing hair, glossy hair, hair is water, {{{super detailed skin}}}, masterpiece, masterwork, good lighting, glass tint, zoom in on eyes, {{reflective eyes}},  {{hair dripping}}, water eye",
    "ugly,duplicate,morbid,mutilated,tranny,trans,mutation,deformed,long neck,bad anatomy,bad proportions,extra arms,extra legs, disfigured,more than 2 nipples,malformed,mutated,hermaphrodite,out of frame,extra limbs,missing arms,missing legs,poorly drawn hands,poorty drawn face,mutation,poorly drawn,long body,multiple breasts,cloned face,gross proportions,   mutated hands,bad hands,bad feet,long neck,missing limb,malformed limbs,malformed hands,fused fingers,too many fingers,extra fingers,missing fingers,extra digit,fewer digits,mutated hands and fingers,lowres,text,error,cropped,worst quality,low quality,normal quality,blurry",
    "None",
    "None",
    28,
    "Euler a",
    false,
    false,
    1,
    1,
    7,
    -1,
    -1,
    0,
    0,
    0,
    false,
    832,
    512,
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
    "width": 512,
    "height": 832,
    "sampler_name": "Euler a",
    "cfg_scale": 7,
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
      params[0] + "\nNegative prompt: " + params[1] + "\nSteps: 28, Sampler: Euler a, CFG scale: 7, Seed: 1637418386, Size: 512x832, Model hash: 0b16241c, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, First pass size: 0x0"
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