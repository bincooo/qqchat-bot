import { draw, reset } from '../src/util/draw'
import { initParams } from '../src/handler/novel-ai'

async function main() {

  const data = initParams('petite, 1girl, solo, pink hair, very long hair, school uniform')
  const session_hash = '0dfva4ltz7i4'
  // console.log(data)
  const path = await draw({
    data, session_hash
  })

  console.log('NovelAI genarate to path:', path)
  // await reset(session_hash)
}

main().then(() => {
  process.exit(1)
})