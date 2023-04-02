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

function mp3ToSilk(filepath, outputDir = './tmp') {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    const voice = new WxVoice('./tmp', ffmpegPath)
    voice.encode(filepath, `${outputDir}/${filename}.silk`, {format: 'silk'}, (path) => {
      if (path) {
        resolve(path)
      } else {
        reject('mp3 convert to silk Error !!!')
      }
      // fs.unlinkSync(filepath)
    })
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
    return switchSuffix(vt, path)
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

const BaseURL = 'wss://eastus.api.speech.microsoft.com/cognitiveservices/websocket/v1?TrafficType=AzureDemo&X-ConnectionId='

class Stat {
  static START = new Stat('Path:turn.start')
  static END = new Stat('Path:turn.end')

  protected _str: string
  constructor(str: string) {
    this._str = str
  }

  assert(str: string) {
    return str.includes(this._str)
  }
}

interface PromiseExecutor {
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}

const ttsMap = new Map<string, Buffer>()
const timerMap = new Map<string, PromiseExecutor>()
let heartbeatTimer: NodeJS.Timer | null = null

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

async function conn(): Promise<WebSocket> {
  const cid = genCid()

  const ws = new WebSocket(BaseURL + cid,
    {
      host: 'eastus.api.speech.microsoft.com',
      origin: 'https://azure.microsoft.com',
      headers: {
        'X-real-ip': ip,
        'X-Forwarded-For': ip,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41',
      }
    })
  return new Promise((resolve, reject) => {
    ws.on('open', () => { 
      if (config.debug) {
        console.log('MS_TTS is open: ' + cid)
      }
      resolve(ws)
    })
    ws.on('close', (code, reason) => {
      if (heartbeatTimer) {
        clearTimeout(heartbeatTimer)
      }
      for (let [key, value] of timerMap) {
        value.reject(`connect is closed: ${reason} ${code}`)
      }
      _ws = null
      heartbeatTimer = null
      ttsMap.clear()
      timerMap.clear()
    })
    ws.on('message', (msg: any, isBinary: boolean) => {
      const regex = /X-RequestId:(?<id>[a-z|0-9]*)/
      const matches = msg.toString()
        .match(regex)

      if (!isBinary) {
        if (Stat.START.assert(msg.toString())) {
          ttsMap.set(matches.groups.id, Buffer.from([]))
        }
        else
        if (Stat.END.assert(msg.toString())) {
          const id = matches.groups.id
          if (timerMap.has(id)) {
            const timer = timerMap.get(id)
            const buffer = ttsMap.get(id)
            timer?.resolve(buffer)
            timerMap.delete(id)
          }
        }
      } else {
        const separator = 'Path:audio\r\n'
        const buffer = msg as Buffer
        const index = buffer.indexOf(separator) + separator.length
        const h = buffer.slice(2, index).toString()
        const matches = h.match(regex)
        const id = matches.groups.id

        if (ttsMap.has(id)) {
          const newBuffer = Buffer.concat([ttsMap.get(id), buffer.slice(index)])
          ttsMap.set(id, newBuffer)
        }
      }
    })
    ws.on('error', (error) => {
      reject(`ERR ${error}`)
      // 报错了修改虚拟ip预防封控
      ip = IP()
    })
    ws.on('ping', (data) => {
      ws.pong(data)
      if (config.debug) {
        console.debug('sent pong %s', data)
      }
    })
    ws.on('pong', (data) => {
      if (config.debug) {
        console.debug('received pong %s', data)
      }
    })
  })
}

async function sendHeartbeat() {
  if (_ws && _ws.readyState === WebSocket.OPEN) {
    const cid = genCid()
    const ssml = `X-Timestamp:${Date()}\r\nX-RequestId:${cid}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n`
      + '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US"><voice name="en-US-JennyNeural"><prosody rate="0%" pitch="0%">嘀</prosody></voice></speak>'
    await _ws.ping()
    await _ws.send(ssml, (err) => {})
  }
}

let _ws: WebSocket | null = null

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
      <prosody ${rate !== -1 ? ('rate="'+rate+'%"') : ''} ${pitch !== -1 ? ('pitch="'+pitch+'%"') : ''}>${text.trim()}</prosody>
    </mstts:express-as>
  </voice>
</speak>`
  } else {
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
  <voice name="${vname}">
    <lexicon uri="${lexicon}"/>
    <mstts:express-as style="${sname}">
      <prosody ${rate !== -1 ? ('rate="'+rate+'%"') : ''} ${pitch !== -1 ? ('pitch="'+pitch+'%"') : ''}>${text.trim()}</prosody>
    </mstts:express-as>
  </voice>
</speak>`
  }
}


// https://speech.microsoft.com/portal/9be764e411c24d96b5b5c0f068d4437f/voicegallery
// https://azure.microsoft.com/zh-cn/products/cognitive-services/text-to-speech/#features
async function speak(
  conf: Config,
  type: string = 'audio-48khz-96kbitrate-mono-mp3',
  vt: string = 'mp3ToSilk'
) {

  if (!fs.existsSync('./tmp')) {
    fs.mkdirSync('./tmp', { recursive: true })
  }

  if (!_ws || _ws.readyState !== WebSocket.OPEN) {
    _ws = await conn()
  }

  const cid = genCid()
  const ssml = buildSsml(conf)
  if (config.debug) {
    console.log('speak:\r\n' + ssml)
  }
  const combi = new Promise((resolve, reject) => {
    timerMap.set(cid, { resolve, reject })
    const speechConfig = {
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: 'false',
              wordBoundaryEnabled: 'false',
            },
            outputFormat: type,
          }
        }
      }
    }

    const msg = `X-Timestamp:${Date()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify(speechConfig)}`
    _ws.send(msg, (err) => {
      if (err) {
        console.error('ERR: cid: ' + cid + ',config request fail ! stack:', err)
        return
      }

      const _ssml = `X-Timestamp:${Date()}\r\nX-RequestId:${cid}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      _ws.send(_ssml, (e) => {
        if (e) {
          console.error('ERR: cid: ' + cid + ', message request fail ! stack:', e)
        }
      })
    })
  })

  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
  }

  heartbeatTimer = setInterval(sendHeartbeat, 10 * 1000)
  const buf = await Promise.race([
    combi,
    new Promise((res, rej) => {
      setTimeout(() => {
        ttsMap.delete(cid)
        timerMap.delete(cid)
        rej('timeout')
        ip = IP()
      }, 30 * 1000)
    })
  ])

  return await saveFile(buf, vt)
}

speak.close = () => {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer)
  }
  _ws = null
  heartbeatTimer = null
  ttsMap.clear()
  timerMap.clear()
}

export default speak

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
        await delay(3000)

        if (result) {
          if (config.debug) {
            console.log('azureSpeak :: speakTextAsync succsess === >>>', result)
          }
          try {
            const path = await switchSuffix('wavToSilk', `./tmp/${cid}.wav`)
            console.log('switchSuffix: ', path)
            resolve(path)
          } catch(err) {
            console.log('switchSuffix err:', err)
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

