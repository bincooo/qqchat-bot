import { segment } from 'oicq'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { initParams } from 'src/handler/novel-ai'
import { config } from 'src/config'
import { sendGet } from 'src/util/draw'
import { Sender } from 'src/model/sender'
import Jimp from 'jimp'
import path from 'path'
import ffmpeg from 'ffmpeg-static'
import fs from 'fs'
import { randomBytes } from 'crypto'

import util from 'util'
import execcmd from 'child_process'


function genUid(): string {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
    .substr(0, 10)
}

export class CatgirlFilter extends BaseMessageFilter {

  protected _uuid?: string = genUid()

  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender: Sender) => {
    let resultMessage = ''
    const { preface, betterPic } = config.api

    if (preface.enable && preface.image) {

      const result = (content.match(/\[([a-z_A-Z]{1,},[^\]]+)]/i)??[])[1]
      if (!result) return [ true, content ]
      try {
        // 开启猫娘图文模式
        const split = result.replaceAll('\.', '')
          .split(',')
          .filter(item => !!item.trim())
        const prompt = initParams(`petite, 1girl, solo, {{cat ear}}, pink hair, very long hair, school uniform, ${split.join(',')},{{{{{extreme close up of face}}}}}, {{{{by famous artist}}}, beautiful, masterpiece, reflective hair, medium butt, good lighting, tanktop, {{looking at you}}, focus on face, dark blue skirt, {{{{by wadim kashin}}}}, {{{{ray tracing}}}}, {{water droplets on face}} , flowing hair, glossy hair, hair is water, {{{super detailed skin}}}, masterpiece, masterwork, detailed, good lighting, glass tint, zoom in on eyes, {{reflective eyes}}, {{hair dripping}}, water eyes,`)
        const path = await retry(
          () => draw({
            prompt,
            session_hash: this._uuid,
            try4K: false
          }),
          3,
          500
        )

        const m1 = (content.match(/【([^】]{1,})】/i)??[])[1]??''
        const m2 = (content.match(/\[([^\]]{1,})\]/i)??[])[1]??''
        console.log('cat girl test >> m1: ' + m1 + ', m2: ' + m2)

        const newpath = await this.fontImage(path, m1, m2)
        const buf = await fs.readFileSync(newpath)
        sender.reply(segment.image('base64://' + buf.toString('base64')))

      } catch(err) {
        console.log(err)
      }
    }

    return [ true, content ]
  }

  async fontImage(url: string, m1: string, m2?:stirng = ''): Promise<string> {
    const buf = await sendGet(url)
    const drawPath = await this.save(buf)
    const executor = util.promisify(execcmd.exec)
    let cmd: string = ffmpeg.path

    const stepSplit = (step: number, text: string) => {
      const count = text.length / step
      const result = []
      for(let i = 0; i < count; i++) {
        result.push(text.substr(i*step, step))
      }
      return result
    }

    const jpg = 'static/white-512x300.jpg',
      step = 17

    const text = stepSplit(step, m1).join('\n') + '\n\n--------\n' + stepSplit(step, m2).join('\n')
    const fontjpg = `amr/${genUid()}.jpg`
    // fontsize=55:x=40:y=40
    const fontsize = 'fontsize=28:x=15:y=15'
    const { err } = await executor(`${cmd} -i ${jpg} -vf "drawtext=fontfile=static/font.ttf:${fontsize}:fontcolor=black:text='${text}':shadowx=0:shadowy=0:alpha=1" -y ${fontjpg}`)
    console.log('err', err)
    if (err) throw err

    const image = await Jimp.read(drawPath)
    const src = await Jimp.read(fontjpg)

    await image.composite(src, 0, 832 - 300/* 1664 - 566 */, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.8
    })
    const result = `amr/${genUid()}.jpg`
    await image.writeAsync(result)
    return result
  }

  save(buffer: Buffer): Promise<string> {
    const path = `amr/${genUid()}.jpg`
    return new Promise<string>((resolve, reject) => {
      fs.writeFile(path, buffer, (err) => {
        if (err) {
          reject('save ' + path + ' fail[save img]: ' + err)
        } else {
          resolve(path)
        }
      })
    })
  }
}