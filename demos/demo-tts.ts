import speak from '../src/util/tts'
import fs from 'fs'

async function main() {
  const path = await speak({
    text: '你好呀我的主人'
  }, 'audio-24khz-96kbitrate-mono-mp3')
  console.log('转化成功: ' + path)
}

main()