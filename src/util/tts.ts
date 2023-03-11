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

let voice = null
function mp3ToAmr(filepath, outputDir = './amr') {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    if (etc != 'mp3') {
      reject('please input a mp3 file ~')
      return
    }
    const cmdStr = `${ffmpegPath} -y -i ${filepath} -ac 1 -ar 8000 ${outputDir}/${filename}.amr`
    const executor = util.promisify(execcmd.exec)
    
    executor(cmdStr, (err, stdout, stderr) => {
      if (err) {
        reject('error:' + stderr)
      } else {
        resolve(`${outputDir}/${filename}.amr`)
      }
    })
  })
}

function mp3ToSilk(filepath, outputDir = './amr') {
  return new Promise((resolve, reject) => {
    const basename = path.basename(filepath)
    const etc = basename.split('.').pop()
    const filename = basename.replace('.' + etc , '')
    if (etc != 'mp3') {
      reject('please input a mp3 file ~')
      return
    }
    if (!voice) voice = new WxVoice('./amr', ffmpegPath)
    voice.encode(filepath, `${outputDir}/${filename}.silk`, {format: 'silk'}, (path) => {
      if (path) {
        resolve(path)
      } else {
        reject('mp3 convert to silk Error !!!')
      }
    })
  })
}

async function saveFile(buffer: Buffer): Promise<string> {
  const cid = genCid()
  return new Promise((resolve, reject) => {
    fs.writeFile(`./amr/${cid}.mp3`, buffer, (err) => {
      if (err) {
        reject('generate voice fail[save mp3]: ' + err)
      } else {
        resolve(`./amr/${cid}.mp3`)
      }
    })
  }).then(path => {
    // return mp3ToAmr(path)
    return mp3ToSilk(path)
  })
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

async function conn(): Promise<WebSocket> {
  const cid = genCid()
  const ws = new WebSocket(BaseURL + cid,
    {
      host: 'eastus.tts.speech.microsoft.com',
      origin: 'https://azure.microsoft.com',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.66 Safari/537.36 Edg/103.0.1264.44',
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
    })
    // ws.on('ping', (data) => {
    //   ws.pong(data)
    //   console.debug('sent pong %s', data)
    // })
    // ws.on('pong', (data) => {
    //   console.debug('received pong %s', data)
    // })
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
  text: string
  vname?: string
  sname?: string
  degree?: number
  lexicon?: string,
  rate?: number,
  pitch?: number
}


function buildSsml(config: Config) {
  const {
    text,
    vname = 'zh-CN-XiaoshuangNeural',
    sname = 'general',
    degree = 1.0,
    lexicon = '',
    rate = 0,
    pitch = 0
  } = config

  if (!lexicon) {
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
      <voice name="${vname}">
        <mstts:express-as style="${sname}" styledegree="${degree}">
          <prosody rate="${rate}%" pitch="${pitch}%">${text}</prosody>
        </mstts:express-as>
      </voice>
     </speak>`
  } else {
    return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
      <voice name="${vname}">
        <lexicon uri="${lexicon}"/>
          <mstts:express-as style="${sname}" styledegree="${degree}">
            <prosody rate="${rate}%" pitch="${pitch}%">${text}</prosody>
          </mstts:express-as>
        </lexicon>
      </voice>
     </speak>`
  }
}


// https://azure.microsoft.com/zh-cn/products/cognitive-services/text-to-speech/#features
async function speak(
  conf: Config,
  type: string = 'audio-24khz-96kbitrate-mono-mp3'
) {

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
      }, 60 * 1000)
    })
  ])

  return await saveFile(buf)
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



