import { SpeechConfig, AudioConfig, SpeechSynthesizer } from 'microsoft-cognitiveservices-speech-sdk'
import { randomBytes } from 'crypto'
import { WebSocket } from 'ws'
import util from 'util'
import execcmd from 'child_process'
import path from 'path'
import fs from 'fs'
import WxVoice from 'wx-voice'
import ffmpeg from 'ffmpeg-static'
import { config } from 'src/config'
import delay from 'delay'

const ffmpegPath = (() => {
  return (typeof ffmpeg === 'string') ? ffmpeg : ffmpeg.path
})()

let ip = IP()
let voice = null
function mp3ToAmr(filepath, outputDir = './tmp') {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    const cmdStr = `${ffmpegPath} -y -i ${filepath} -ac 1 -ar 8000 ${outputDir}/${filename}.amr`
    const executor = util.promisify(execcmd.exec)
    
    executor(cmdStr, (err, stdout, stderr) => {
      if (err) {
        reject('error:' + stderr)
      } else {
        resolve(`${outputDir}/${filename}.amr`)
      }
      // fs.unlinkSync(filepath)
    })
  })
}

function cmd_wavToSilk(filepath, outputDir = "./tmp") {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    const cmdStr = `wx-voice encode -i ${filepath} -o ${ffmpegPath}.silk -f silk_amr`
    const executor = util.promisify(execcmd.exec)
    
    executor(cmdStr, (err, stdout, stderr) => {
      if (err) {
        reject('error:' + stderr)
      } else {
        resolve(`${ffmpegPath}.silk`)
      }
      // fs.unlinkSync(filepath)
    })
  })
}

function mp3ToSilk(filepath, outputDir = './tmp') {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    if(!voice) {
      voice = new WxVoice('./tmp', ffmpegPath)
      voice.on("error", (err) => console.log('WxVoice Error: ', err))
    }
    const enSilk = (retry: number = 5) => {
      voice.encode(filepath, `${outputDir}/${filename}.silk`, {format: 'silk_amr'}, (path) => {
        if (path) {
          resolve(path)
        } else {
          if (retry >= 0) {
            enSilk(retry - 1)
          }
          else reject('mp3 convert to silk Error !!! : ' + path)
        }
        // fs.unlinkSync(filepath)
      })
    }
    enSilk()
  })
}

async function saveFile(buffer: Buffer, vt: string = 'mp3ToSilk'): Promise<string> {
  const cid = genCid()
  return new Promise((resolve, reject) => {
    fs.writeFile(`./tmp/${cid}.tmp`, buffer, (err) => {
      if (err) {
        reject('generate voice fail: ' + err)
      } else {
        resolve(`./tmp/${cid}.tmp`)
      }
    })
  }).then(path => {
    return delay(800)
      .then(() => switchSuffix(vt, path))
  })
}

async function switchSuffix(vt: string, path: string): Promise<string> {
  const rename = (v1: string, v2: string): string => {
    if(v1.endsWith('.tmp')) {
      const result = v1.replace('.tmp', '.' + v2)
      fs.renameSync(v1, result)
      return result
    } else return v1
  }

  let count = 10
  while (count-- > 0) { // 阻塞一会，检查下文件生成没有
    if(fs.existsSync(path))
      break
    await delay(500)
  }

  switch(vt) {
    case 'wav':
    case 'mp3':
    case 'pcm':
      return rename(path, vt)
    case 'mp3ToAmr':
      return mp3ToAmr(rename(path, 'mp3'))
    case 'wavToSilk':
    case 'mp3ToSilk':
    default:
      return mp3ToSilk(rename(path, 'mp3'))
  }
}

function genCid() {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
}

function IP() {
  return (
    // Math.floor(Math.random() * (10 - 255) + 255) +
    '54.' +
    // Math.floor(Math.random() * (10 - 255) + 255) +
    '68.' +
    Math.floor(Math.random() * (10 - 255) + 255) +
    '.' +
    Math.floor(Math.random() * (10 - 255) + 255)
  )
}


declare type Config = {
  // 讲话内容
  text: string
  // 讲话类型：晓晓、晓依 <voice name="${vname}"> // zh-CN-XiaoyiNeural
  vname?: string
  // 情绪： <mstts:express-as style="${sname}"> // affectionate
  sname?: string
  // 多音词典url
  lexicon?: string,
  // 语速： <prosody volume='+50.00%' rate="${rate}%" pitch="${pitch}%">${text.trim()}</prosody>
  rate?: number, 
  // 音调： <prosody volume='+50.00%' rate="${rate}%" pitch="${pitch}%">${text.trim()}</prosody>
  pitch?: number
}


function buildSsml(config: Config) {
  const {
    text,
    vname = 'zh-CN-XiaoyiNeural',
    sname = 'affectionate',
    lexicon = '',
    rate = -1,
    pitch = -1
  } = config
  if (!text || !text.trim()) {
    throw new Error('text is empty!')
  }
  if (!lexicon) {
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
  <voice name="${vname}">
    <mstts:express-as style="${sname}">
      <prosody volume="+50.00%" ${rate !== -1 ? ('rate="'+rate+'%"') : ''} ${pitch !== -1 ? ('pitch="'+pitch+'%"') : ''}>${text.trim()}</prosody>
    </mstts:express-as>
  </voice>
</speak>`
  } else {
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
  <voice name="${vname}">
    <lexicon uri="${lexicon}"/>
    <mstts:express-as style="${sname}">
      <prosody volume="+50.00%" ${rate !== -1 ? ('rate="'+rate+'%"') : ''} ${pitch !== -1 ? ('pitch="'+pitch+'%"') : ''}>${text.trim()}</prosody>
    </mstts:express-as>
  </voice>
</speak>`
  }
}


// https://speech.microsoft.com/portal/9be764e411c24d96b5b5c0f068d4437f/voicegallery
// https://azure.microsoft.com/zh-cn/products/cognitive-services/text-to-speech/#features
let speechConfig = null

export async function azureSpeak(
  conf: Config,
  vt: string = 'mp3ToSilk'
) {
  if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp', { recursive: true })
  }

  const cid = genCid()
  const audioConfig = AudioConfig.fromAudioFileOutput(`./tmp/${cid}.wav`)
  if (!speechConfig) {
    speechConfig = SpeechConfig.fromSubscription(config.azureSdk.key, config.azureSdk.region)
  }
  return new Promise<string>((resolve, reject) => {
    const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig)
    const ssml: string = buildSsml(conf)
    synthesizer.speakSsmlAsync(ssml,
      async result => {
        synthesizer.close()
        if (result) {
          if (config.debug) {
            console.log('azureSpeak :: speakTextAsync succsess === >>>', result)
          }
          try {
            resolve((await switchSuffix('wavToSilk', `./tmp/${cid}.wav`)))
          } catch(err) {
            reject(err)
          }
          // resolve(`./tmp/${cid}.wav`)
        } else {
          reject('`azureSpeak` generate voice fail !')
        }
      },
      error => {
        console.log('azureSpeak :: speakTextAsync error === >>>', error)
        synthesizer.close()
        reject(error)
      })
  })
}

