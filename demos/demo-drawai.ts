import { draw, reset } from '../src/util/draw'
import { initParams } from '../src/handler/novel-ai'
import retry from '../src/util/retry'

async function main() {

  const data = initParams('petite, 1girl, solo, pink hair, very long hair, school uniform')
  const session_hash = '0dfva4ltz7i4'
  // console.log(data)
  // const path = await draw({
  //   data, session_hash
  // })

  retry(
    draw({ data, session_hash: this._uuid }),
    3,
    500
  )
  .then(path => {
    console.log('NovelAI genarate to path:', path)
  })
  .catch(err => {
    console.log('NovelAI Error:', err)
  })

  // console.log('NovelAI genarate to path:', path)
  // await reset(session_hash)
}

main()
  // .then(() => {
  //   process.exit(1)
  // })