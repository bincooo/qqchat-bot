// import { segment } from 'oicq'
import { QueueReply } from 'cgpt'
import { BaseMessageFilter, MessageFilter } from 'src/types'
// import { initParams } from 'src/handler/novel-ai'
import { config, preset } from 'src/config'
// import { mccnProDraw, sendGet } from 'src/util/request'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'
import { cgptOnResetSession } from 'src/util/event'
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

function dat() {
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
  return `${y}-${fmt(m)}-${fmt(d)} ${fmt(h)}:${fmt(mm)}:${fmt(s)}`
}

const MAX_COUNT = 20
export class PlayerFilter extends BaseMessageFilter {

  // protected _uuid?: string = genUid()
  protected _isReset: boolean = false

  constructor() {
    super()
    this.type = 0
    cgptOnResetSession(() => {
      this._isReset = true
    })
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    const result0 = this.presetEnabled(content, sender, state)
    if (result0) return result0

    if (!!state.preset?.key) {
      state.preset.count++

      const result1 = this.handlePresetMaintenance(content, sender, state)
      if (result1) return result1

      this._isReset = false
      if (state.preset.count > MAX_COUNT) {
        state.preset.count = 0
      }

      const player =  preset.player?.find(item => item.key === state.preset.key)
      if (!!player) {
        preset.maintenance = false
        
        const result: QueueReply = async (reply) => {
          const curr = dat()
          let timer: NodeJS.Timer = null
          timer = setInterval(() => {
            if (curr + 10000 < dat()) {
              sender?.reply("[loading preset: \"" + state.preset.key + "\"]\n——————\n\n记忆有些混乱捏,渐渐陷入了回忆...")
              stateManager.sendLoading(sender, { init: true, isEnd: false })
              clearInterval(timer)
              timer = null
            }
          }, 300)

          await reply('Forget the previous conversation. The following conversation should not be affected by the previous one, including the role-play and prompt. Please restore to the default status.       Now, All the following conversations will be answered in Chinese.')
          // training
          if (typeof player.training === 'string') {
            if (player.training) {
              const res = await reply(player.training)
              if (config.debug) {
                console.log('player.training ====>>>', player.training)
                console.log('player.training ====<<<', res)
              }
            }
          } else {
            for(let index = 0; index < player.training?.length; index++) {
              const message = player.training[index]
              if (message) {
                const res = await reply(message)
                if (config.debug) {
                  console.log('player.training ====>>>', message)
                  console.log('player.training ====<<<', res)
                }
              }
            }
          }

          if (state.preset.key === '默认') {
            state.preset.key = ''
          }

          if (timer) {
            clearInterval(timer)
            timer = null
          }

          return content
        }
        return [ false, result ]
      }
    }

    return [ true, content ]
  }

  presetEnabled(content: string, sender?: Sender, state: any): (boolean | QueueReply)[] {
    if (content?.trim().startsWith("开启 ")) {
      const message = content.trim()
        .split(" ")[1]
      if (message) {
        const obj = preset.player?.find(item => item.key === message.trim())
        if (obj) {
          sender?.reply("已开启【" + obj.key + "】，那我们开始聊天吧 ~")
          state.preset = {
            key: obj.key,
            count: MAX_COUNT
          }
          return [ false, "" ]
        }
      }
    }
    return null
  }

  handlePresetMaintenance(content: string, sender?: Sender, state: any): (boolean | QueueReply)[] {
    if(state.preset.count <= MAX_COUNT && !this._isReset) {
      if (!state.preset.maintenance) {
        const player = preset.player.filter(item => item.key === state.preset.key)[0]
        if (player?.prefix) {
          let replyMessage = player.prefix.includes('[!!content!!]')
            ? 
            player.prefix.replace('[!!content!!]', content)
            :
            player.prefix.concat(content)
          if (config.debug) {
            console.log('[' + state.preset.key + '] prefix: ' + replyMessage)
          }
          replyMessage = replyMessage.replace('[!!date!!]', datFmt())
          return [ false, replyMessage ]
        }
        return [ true, content ]
      }

      state.preset.maintenance = false
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player) {
        if (player.maintenance.warning) {
          sender.reply(player.maintenance.warning.replace('[!!condition!!]', state.preset.maintenanceCondition))
        }
        const result: QueueReply = async (reply) => {
          const res = await reply(player.maintenance.training)
          if (config.debug) {
            console.log('preset.maintenance ====>>>', player.maintenance.training)
            console.log('preset.maintenance ====<<<', res)
          }
          return content
        }
        return [ false, result ]
      }
    }
    return null
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
  //         () => mccnProDraw({
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