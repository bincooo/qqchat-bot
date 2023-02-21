import { draw, reset, _4K } from '../src/util/draw'
import { initParams } from '../src/handler/novel-ai'
import retry from '../src/util/retry'
import Jimp from 'jimp'
import path from 'path'
import ffmpeg from 'ffmpeg-static'

import util from 'util'
import execcmd from 'child_process'

// function dat() {
//   return new Date()
//     .getTime()
// }

async function main() {

  const data = initParams('petite, 1girl, solo, pink hair, very long hair, school uniform')
  const session_hash = '0dfva4ltz7i4'
  // console.log(data)
  // const path = await draw({
  //   data, session_hash
  // })

  // retry(
  //   () => draw({ data, session_hash: this._uuid, try4K: true }),
  //   3,
  //   500
  // )
  // .then(path => {
  //   console.log('NovelAI genarate to path:', path)
  //   process.exit(1)
  // })
  // .catch(err => {
  //   console.log('NovelAI Error:', err)
  //   process.exit(1)
  // })

  // const path = await retry(
  //   () => draw({ data, session_hash: this._uuid, try4K: true }),
  //   3,
  //   500
  // )
  // console.log('NovelAI genarate to path:', path)


  const executor = util.promisify(execcmd.exec)
  let cmd: string = ffmpeg.path

  // // const p = path.join(__dirname, '../font/18.fnt')
  // // console.log(p)
  // // const font = await Jimp.loadFont(p)
  // // console.log('load font ~')
  // const image = new Jimp(512, 300, 'white', (err) => {
  //   if (err) throw err
  // })
  // console.log('create image ~')
  // await image.opacity(.9)
  // console.log('image opacity ~')
  // // await image.print(font, 10, 10, '喵！怎么这样子~不要这样欺负猫娘呀')
  // // console.log('image print font ~')
  // await image.writeAsync(`static/white-512x300.jpg`)
  // console.log('image write ~')

  const stepSplit = (step: number, text: string) => {
    const count = text.length / step
    const result = []
    for(let i = 0; i < count; i++) {
      result.push(text.substr(i*step, step))
    }
    return result
  }

  const message1 = '喵！怎么这样子~不要这样欺负猫娘呀',
    message2 = '轻轻地抬起爪子，做出一副生气的样子'
  // if(true) return
  let tmpJpg = 'static/white-512x300.jpg'
  const step = 17
  // for(let index = 0; index < list.length; index++) {
    const text = stepSplit(step, message1).join('\n') + '\n\n--------\n' + stepSplit(step, message2).join('\n')
    const { err } = await executor(`${cmd} -i ${tmpJpg} -vf "drawtext=fontfile=static/font.ttf:fontsize=28:x=15:y=15:fontcolor=black:text='${text}':shadowx=0:shadowy=0:alpha=1" -y new.jpg`)
    console.log('err', err)
    // tmpJpg = 'new.jpg'
    if (err) throw err
  // }

  const image = await Jimp.read("amr/1.png")
  const src = await Jimp.read('new.jpg')
  await image.composite(src, 0, 832 - 300, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.8,
    // opacityDest: 1,
  })
  await image.writeAsync(`result.jpg`)
  process.exit(1)



  // _4K('http://mccn.pro:7860/file=C:\\Users\\Administrator\\AppData\\Local\\Temp\\2\\tmp1i9bixpv\\tmpukv5vsnn.png')
  //   .then(path => {
  //     console.log('NovelAI genarate to path:', path)
  //     process.exit(1)
  //   })
  //   .catch(err => {
  //     console.log('NovelAI Error:', err)
  //     process.exit(1)
  //   })

  // console.log('NovelAI genarate to path:', path)
  // await reset(session_hash)
}

main()
  // .then(() => {
  //   process.exit(1)
  // })