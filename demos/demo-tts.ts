import speak from '../src/util/tts'
import { japaneseUnicodeParser } from '../src/util/lang'
import fs from 'fs'

async function main() {
  const text = `以下は、人気のある日本のアニメの中から、おすすめの10本です。

1. 鬼滅の刃 (Demon Slayer: Kimetsu no Yaiba)
2. 名探偵コナン (Detective Conan)
3. ドラゴンボール (Dragon Ball)
4. ジョジョの奇妙な冒険 (Jojo's Bizarre Adventure)
5. 進撃の巨人 (Attack on Titan)
6. カウボーイビバップ (Cowboy Bebop)
7. ワンピース (One Piece)
8. ナルト (Naruto)
9. 銀魂 (Gintama)
10. プリキュアシリーズ (Pretty Cure series)`
  // const text = '你好呀我的主人'
  const count = japaneseUnicodeParser.count(text)
  const isJapan = () => {
    const str = text
      .replace(/[0-9\s\n]+/g, '')
      .replace(/[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g, '')
    console.log(str, str.length * .2)
    return  str.length * .15 < count
  }
  console.log('isJapan', isJapan(), count)

  const path = await speak({
    text,
    vname: isJapan() ? 'ja-JP-AoiNeural' : null
  }, 'audio-24khz-96kbitrate-mono-mp3')
  console.log('转化成功: ' + path)
}

main()