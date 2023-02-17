import { draw } from '../src/util/draw'
import { initParams } from '../src/handler/novel-ai'

async function main() {

  const data = initParams('cat ear')
  console.log(data)
  const path = await draw({
    data
  })

  console.log('NovelAI genarate to path:', path)
}

main().then(() => {
  process.exit(1)
})