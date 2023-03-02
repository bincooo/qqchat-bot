// import { segment } from 'oicq'
import { QueueReply } from 'cgpt'
import { BaseMessageFilter, MessageFilter } from 'src/types'
// import { initParams } from 'src/handler/novel-ai'
import { config, preset } from 'src/config'
// import { draw, sendGet } from 'src/util/draw'
import { Sender } from 'src/model/sender'
// import retry from 'src/util/retry'
// import Jimp from 'jimp'
// import path from 'path'
// import ffmpeg from 'ffmpeg-static'
// import fs from 'fs'
// import { randomBytes } from 'crypto'

// import util from 'util'
// import execcmd from 'child_process'


// function genUid(): string {
//   return randomBytes(16)
//     .toString('hex')
//     .toLowerCase()
//     .substr(0, 10)
// }
const MAX_COUNT = 10
export class PlayerFilter extends BaseMessageFilter {

  // protected _uuid?: string = genUid()
  protected _active: string = ""
  protected _count: number = MAX_COUNT

  constructor() {
    super()
    this.type = 0
  }

  handle = async (content: string, sender?: Sender) => {
    if (content?.trim().startsWith("开启 ")) {
      const player = content.trim()
        .split(" ")[1]
      if (player) {
        const obj = preset.player?.find(item => item.key === player.trim())
        if (obj) {
          preset.active = obj.key
          sender.reply("已开启【" + preset.active + "】，那我们开始聊天吧 ~")
          return [ false, "" ]
        }
      }
    }

    if (!!preset.active) {
      this._count ++

      if(this._active === preset.active && this._count <= MAX_COUNT) {
        return [ true, content ]
      }

      if (this._active !== preset.active || this._count > MAX_COUNT) {
        this._count = 0
        this._active = preset.active
      }

      const player =  preset.player?.find(item => item.key === preset.active)
      if (!!player) {
        const result: QueueReply = async (reply) => {
          await reply('Forget the previous conversation. The following conversation should not be affected by the previous one, including the role-play and prompt. Please restore to the default status.       Now, All the following conversations will be answered in Chinese.')
          // training
          if (typeof player.training === 'string') {
            if (player.training) {
              await reply(player.training)
            }
          } else {
            for(let index = 0; index < player.training?.length; index++) {
              const message = player.training[index]
              if (message) {
                await reply(message)
              }
            }
          }

          return content
        }
        return [ false, result ]
      }
    }

    return [ true, content ]
  }

  // handle = async (content: string, sender?: Sender) => {
  //   let resultMessage = ''
  //   const { preface, betterPic } = config.api

  //   if (preface.enable && preface.image) {
  //     const regex = /\[([a-z_A-Z]{1,},[^\]]+)]/i
  //     const result = (content.match(regex)??[])[1]
  //     if (!result) return [ true, content ]
  //     try {
  //       // 开启猫娘图文模式
  //       const split = result.replaceAll('\.', '')
  //         .split(', ')
  //         .filter(item => !!item.trim())
  //       const data = initParams(`petite, 1girl, solo, {{cat ear}}, pink hair, very long hair, school uniform, ${split.join(',')},{{{{{extreme close up of face}}}}}, {{{{by famous artist}}}, beautiful, masterpiece, reflective hair, medium butt, good lighting, tanktop, {{looking at you}}, focus on face, dark blue skirt, {{{{by wadim kashin}}}}, {{{{ray tracing}}}}, {{water droplets on face}} , flowing hair, glossy hair, hair is water, {{{super detailed skin}}}, masterpiece, masterwork, detailed, good lighting, glass tint, zoom in on eyes, {{reflective eyes}}, {{hair dripping}}, water eyes,`)
        
  //       const m1 = (content.match(/【([^】]{1,})】/i)??[])[1]??''
  //       const m2 = (content.match(/\(([^\)]{1,})\)/i)??[])[1]??''
  //       console.log('"cat girl" test >> prompt: [' + split.join(',') + '] m1: ' + m1 + ', m2: ' + m2)

  //       retry(
  //         () => draw({
  //           data,
  //           session_hash: this._uuid,
  //           try4K: false
  //         }),
  //         3,
  //         500
  //       )
  //       .then(path => {
  //         this.drawFont(path, m1, m2)
  //           .then(npath => {
  //             const buf = fs.readFileSync(npath)
  //             sender.reply(segment.image('base64://' + buf.toString('base64')))
  //           })
  //           .catch(err => {
  //             console.error('the "cat girl" graphic mode failed: ', err)
  //           })
  //       })

  //       return [ false, content.replace(regex, '') ]
  //     } catch(err) {
  //       console.error(err)
  //     }
  //   }

  //   return [ true, content ]
  // }

  // async drawFont(url: string, m1: string, m2?: string = ''): Promise<string> {
  //   const buf = await sendGet(url)
  //   const drawPath = await this.save(buf)
  //   const executor = util.promisify(execcmd.exec)
  //   let cmd: string = ffmpeg.path

  //   const stepSplit = (step: number, text: string) => {
  //     const count = text.length / step
  //     const result = []
  //     for(let i = 0; i < count; i++) {
  //       result.push(text.substr(i*step, step))
  //     }
  //     return result
  //   }

  //   const jpg = 'static/white-512x300.jpg',
  //     step = 17

  //   const text = stepSplit(step, m1).join('\n') + '\n\n--------\n' + stepSplit(step, m2).join('\n')
  //   const fontjpg = `amr/${genUid()}.jpg`
  //   // fontsize=55:x=40:y=40
  //   const fontsize = 'fontsize=28:x=15:y=15'
  //   const { err } = await executor(`${cmd} -i ${jpg} -vf "drawtext=fontfile=static/font.ttf:${fontsize}:fontcolor=black:text='${text}':shadowx=0:shadowy=0:alpha=1" -y ${fontjpg}`)
  //   // console.log('err', err)
  //   if (err) throw err

  //   const image = await Jimp.read(drawPath)
  //   const src = await Jimp.read(fontjpg)

  //   await image.composite(src, 0, 832 - 300/* 1664 - 566 */, {
  //     mode: Jimp.BLEND_SOURCE_OVER,
  //     opacitySource: 0.8
  //   })
  //   const result = `amr/${genUid()}.jpg`
  //   await image.writeAsync(result)
  //   return result
  // }

  // save(buffer: Buffer): Promise<string> {
  //   const path = `amr/${genUid()}.jpg`
  //   return new Promise<string>((resolve, reject) => {
  //     fs.writeFile(path, buffer, (err) => {
  //       if (err) {
  //         reject('save ' + path + ' fail[save img]: ' + err)
  //       } else {
  //         resolve(path)
  //       }
  //     })
  //   })
  // }
}