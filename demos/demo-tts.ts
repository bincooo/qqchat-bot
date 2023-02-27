import speak from '../src/util/tts'
import { japaneseUnicodeParser } from '../src/util/lang'
import fs from 'fs'

async function main() {
  const text = 'こんにちはご主人様'
  const count = japaneseUnicodeParser.count(text)
  const isJapan = () => {
    return text.length / 2 < count
  }

  const path = await speak({
    text,
    vname: isJapan() ? 'ja-JP-AoiNeural' : null
  }, 'audio-24khz-96kbitrate-mono-mp3')
  console.log('转化成功: ' + path)
}

main()