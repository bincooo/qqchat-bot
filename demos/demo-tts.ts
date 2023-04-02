import speak from '../src/util/tts'
import { japaneseUnicodeParser } from '../src/util/lang'
import fs from 'fs'

/*
    RAW_16KHZ_16BIT_MONO_PCM = "raw-16khz-16bit-mono-pcm",
    RAW_24KHZ_16BIT_MONO_PCM = "raw-24khz-16bit-mono-pcm",
    RAW_48KHZ_16BIT_MONO_PCM = "raw-48khz-16bit-mono-pcm",
    RAW_8KHZ_8BIT_MONO_MULAW = "raw-8khz-8bit-mono-mulaw",
    RAW_8KHZ_8BIT_MONO_ALAW = "raw-8khz-8bit-mono-alaw",
    RAW_16KHZ_16BIT_MONO_TRUESILK = "raw-16khz-16bit-mono-truesilk",
    RAW_24KHZ_16BIT_MONO_TRUESILK = "raw-24khz-16bit-mono-truesilk",
    RIFF_16KHZ_16BIT_MONO_PCM = "riff-16khz-16bit-mono-pcm",
    RIFF_24KHZ_16BIT_MONO_PCM = "riff-24khz-16bit-mono-pcm",
    RIFF_48KHZ_16BIT_MONO_PCM = "riff-48khz-16bit-mono-pcm",
    RIFF_8KHZ_8BIT_MONO_MULAW = "riff-8khz-8bit-mono-mulaw",
    RIFF_8KHZ_8BIT_MONO_ALAW = "riff-8khz-8bit-mono-alaw",
    AUDIO_16KHZ_32KBITRATE_MONO_MP3 = "audio-16khz-32kbitrate-mono-mp3",
    AUDIO_16KHZ_64KBITRATE_MONO_MP3 = "audio-16khz-64kbitrate-mono-mp3",
    AUDIO_16KHZ_128KBITRATE_MONO_MP3 = "audio-16khz-128kbitrate-mono-mp3",
    AUDIO_24KHZ_48KBITRATE_MONO_MP3 = "audio-24khz-48kbitrate-mono-mp3",
    AUDIO_24KHZ_96KBITRATE_MONO_MP3 = "audio-24khz-96kbitrate-mono-mp3",
    AUDIO_24KHZ_160KBITRATE_MONO_MP3 = "audio-24khz-160kbitrate-mono-mp3",
    AUDIO_48KHZ_96KBITRATE_MONO_MP3 = "audio-48khz-96kbitrate-mono-mp3",
    AUDIO_48KHZ_192KBITRATE_MONO_MP3 = "audio-48khz-192kbitrate-mono-mp3",
    WEBM_16KHZ_16BIT_MONO_OPUS = "webm-16khz-16bit-mono-opus",
    WEBM_24KHZ_16BIT_MONO_OPUS = "webm-24khz-16bit-mono-opus",
    OGG_16KHZ_16BIT_MONO_OPUS = "ogg-16khz-16bit-mono-opus",
    OGG_24KHZ_16BIT_MONO_OPUS = "ogg-24khz-16bit-mono-opus",
    OGG_48KHZ_16BIT_MONO_OPUS = "ogg-48khz-16bit-mono-opus"
 */

async function main() {
//   const text = `以下は、人気のある日本のアニメの中から、おすすめの10本です。
// 1. 鬼滅の刃 (Demon Slayer: Kimetsu no Yaiba)
// 2. 名探偵コナン (Detective Conan)
// 3. ドラゴンボール (Dragon Ball)
// 4. ジョジョの奇妙な冒険 (Jojo's Bizarre Adventure)
// 5. 進撃の巨人 (Attack on Titan)
// 6. カウボーイビバップ (Cowboy Bebop)
// 7. ワンピース (One Piece)
// 8. ナルト (Naruto)
// 9. 銀魂 (Gintama)
// 10. プリキュアシリーズ (Pretty Cure series)`
  const text = `你可将此文本替换为所需的任何文本。你可在此文本框中编写或在此处粘贴你自己的文本。
试用不同的语言和声音。改变语速和音调。你甚至可调整 SSML（语音合成标记语言），以控制文本不同部分的声音效果。单击上面的 SSML 试用一下！
请尽情使用文本转语音功能！`
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
    vname: isJapan() ? 'ja-JP-AoiNeural' : undefined
  }, 'audio-48khz-192kbitrate-mono-mp3')
  console.log('转化成功: ' + path)
}

main()
.catch(err => console.log("Error: " + err))