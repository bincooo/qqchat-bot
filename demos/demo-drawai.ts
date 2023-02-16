import { draw } from '../src/util/draw'

async function main() {

  const data = [
    "girl, cat ear, depressed",
    "",
    "naifu基础起手式",
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
    512,
    512,
    false,
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

  const path = await draw({
    data
  })

  console.log('NovelAI genarate to path:', path)
}

main()