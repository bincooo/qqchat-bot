import { config } from 'src/config'
import { Sender } from 'src/model/sender'
import { BaseMessageHandler } from 'src/types'
import logger from 'src/util/log'
import { draw } from 'src/util/draw'
import { filterTokens } from 'src/util/message'
import { segment } from 'oicq'

const pref = '/draw'

export class NovelAiHandler extends BaseMessageHandler {


  async reboot () {
  }

  handle = async (sender: Sender) => {
    if ((sender?.textMessage||'').startsWith(pref)) {
      try {
        sender.reply('正在努力作画, 稍等哦~', true)

        const data = initParams(
          filterTokens(sender?.textMessage.substr(pref.length))
            .trim()
        )
        const path = await draw({ data })
        sender.reply(segment.image(path), true)
      } catch(err) {
        sender.reply(`发生错误\n${err}`, true)
        console.log('NovelAI:Error', err)
      }
      return false
    }

    return true
  }

}

// 提示词参考: https://www.yuque.com/longyuye/lmgcwy
const initParams = function(prompt: string): Array<any> {
  if (prompt.endsWith(',')) {
    prompt = prompt.substr(0, prompt.length - 1)
  }
  const params = [
    prompt + ", petite, 1girl, solo, pink hair, very long hair, school uniform,{{{{by famous artist}}}, beautiful, masterpiece, reflective hair, medium butt, good lighting, tanktop, {{looking at you}}, focus on face, dark blue skirt, {{{{by wadim kashin}}}}, {{{{ray tracing}}}}, {{water droplets on face}} , flowing hair, glossy hair, hair is water, {{{super detailed skin}}}, masterpiece, masterwork, detailed, unamused, good lighting, glass tint, zoom in on eyes, {{reflective eyes}}, {{hair dripping}}, water eye,",
    "ugly,duplicate,morbid,mutilated,tranny,trans,trannsexual,mutation,deformed,long neck,bad anatomy,bad proportions,extra arms,extra legs, disfigured,more than 2 nipples,malformed,mutated,hermaphrodite,out of frame,extra limbs,missing arms,missing legs,poorly drawn hands,poorty drawn face,mutation,poorly drawn,long body,multiple breasts,cloned face,gross proportions, mutated hands,bad hands,bad feet,long neck,missing limb,malformed limbs,malformed hands,fused fingers,too many fingers,extra fingers,missing fingers,extra digit,fewer digits,mutated hands and fingers,lowres,text,error,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,text font ui,futa,yaoi",
    "None",
    "None",
    28,
    "Euler a",
    false,
    false,
    1,
    1,
    5.5,
    -1,
    -1,
    0,
    0,
    0,
    false,
    960,
    640,
    true,
    0.7,
    0,
    0,
    "None",
    0.9,
    8,
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
    "seed": 3969714403,
    "all_seeds": [
      3969714403
    ],
    "subseed": 3432233590,
    "all_subseeds": [
      3432233590
    ],
    "subseed_strength": 0,
    "width": 640,
    "height": 960,
    "sampler_name": "Euler a",
    "cfg_scale": 5.5,
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
      "petite, 1girl, solo, pink hair, very long hair, school uniform,{{{{by famous artist}}}, beautiful, masterpiece, reflective hair, medium butt, good lighting, tanktop, {{looking at you}}, focus on face, dark blue skirt, {{{{by wadim kashin}}}}, {{{{ray tracing}}}}, {{water droplets on face}} , flowing hair, glossy hair, hair is water, {{{super detailed skin}}}, masterpiece, masterwork, detailed, unamused, good lighting, glass tint, zoom in on eyes, {{reflective eyes}}, {{hair dripping}}, water eye,\nNegative prompt: ugly,duplicate,morbid,mutilated,tranny,trans,trannsexual,mutation,deformed,long neck,bad anatomy,bad proportions,extra arms,extra legs, disfigured,more than 2 nipples,malformed,mutated,hermaphrodite,out of frame,extra limbs,missing arms,missing legs,poorly drawn hands,poorty drawn face,mutation,poorly drawn,long body,multiple breasts,cloned face,gross proportions, mutated hands,bad hands,bad feet,long neck,missing limb,malformed limbs,malformed hands,fused fingers,too many fingers,extra fingers,missing fingers,extra digit,fewer digits,mutated hands and fingers,lowres,text,error,cropped,worst quality,low quality,normal quality,jpeg artifacts,signature,watermark,username,blurry,text font ui,futa,yaoi\nSteps: 28, Sampler: Euler a, CFG scale: 5.5, Seed: 3969714403, Size: 640x960, Model hash: 0b16241c, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, First pass size: 0x0"
    ],
    "styles": [
      "None",
      "None"
    ],
    "job_timestamp": "20230217072651",
    "clip_skip": 2,
    "is_using_inpainting_conditioning": false
  })]
}


const str = function(json: any) {
  return JSON.stringify(json)
}