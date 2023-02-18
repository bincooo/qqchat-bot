import { draw, reset, _4K } from '../src/util/draw'
import { initParams } from '../src/handler/novel-ai'
import retry from '../src/util/retry'

async function main() {

  const data = initParams('petite, 1girl, solo, pink hair, very long hair, school uniform')
  const session_hash = '0dfva4ltz7i4'
  // console.log(data)
  // const path = await draw({
  //   data, session_hash
  // })

  // retry(
  //   draw({ data, session_hash: this._uuid, try4K: true }),
  //   3,
  //   500
  // )
  // .then(path => {
  //   console.log('NovelAI genarate to path:', path)
  // })
  // .catch(err => {
  //   console.log('NovelAI Error:', err)
  // })
  _4K('C:\\Users\\Administrator\\AppData\\Local\\Temp\\2\\tmp1i9bixpv\\tmpukv5vsnn.png')
    .then(path => {
      console.log('NovelAI genarate to path:', path)
      process.exit(1)
    })
    .catch(err => {
      console.log('NovelAI Error:', err)
      process.exit(1)
    })

  // console.log('NovelAI genarate to path:', path)
  // await reset(session_hash)
}

main()
  // .then(() => {
  //   process.exit(1)
  // })