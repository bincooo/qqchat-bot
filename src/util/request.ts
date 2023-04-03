import http from 'http'
import https from 'https'
import FormData from 'form-data'
import _url from 'url'
import ProxyAgent from 'https-proxy-agent'
import urlencode from 'urlencode'
import retry from './retry'
import { config } from 'src/config'
import delay from 'delay'


const BASE_NOVEL_AI_PATH = "https://www.icu-web.tk:8082/novel-ai"
const _globalThis: {
  mccnPro?: {
    fn_index: number
    cookie: string
    expires: number
    page?: Page
  }
  spider: {
    picwishCn?: Page
  }
} = {
  spider: {
  },
  mccnPro: {
    fn_index: -1,
    cookie: null,
    expires: 0
  }
}

export async function openAIAuth(email: string, passwd: string): Promise<any> {
  const { auth } = config.openaiWebAPI.endpoint ?? {}
  if (!auth) throw new Error('The server address from which the accessToken was obtained did not exist !')
  const { data } = await sendPost(auth, str({ email, passwd }), {
    'content-type': 'application/json'
  })
  return JSON.parse(data)
}

// export function clashSetting(name: string): Promise<boolean> {
//   return new Promise<boolean>((resolve, reject) => {
//     sendPut(config.clash.http, str({ name }), {
//       'content-type': 'application/json'
//     })
//     .then(_ => resolve(true))
//     .catch(err => {
//       console.log('Error: clash edit proxies fail !', err)
//       resolve(false)
//     })
//   })
// }



export function drawing(opts: {
  data: any
  try4K?: boolean
  callback?: () => void
}): Promise<string> {

  const {
    data,
    try4K = false,
    callback
  } = opts

  return new Promise<string>((resolve, reject) => {
    sendPost(BASE_NOVEL_AI_PATH + '/sdapi/v1/txt2img', str(data), {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // 'X-Forwarded-For': ip,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
    })
    .then(({ data: res }) => {
      try {
        if (config.debug) {
          console.log('drawing result =======>>>>>', res)
        }
        const result = (JSON.parse(res)?.images??[])[0]
        // if (try4K) {
        //   if (callback) {
        //     callback()
        //   }

        //   retry(() => tryBetter(result), 3, 800)
        //     .then(b64 => {
        //       if (b64) {
        //         resolve(b64)
        //       } else resolve(result)
        //     })
        //     .catch((err) => {
        //       console.log(err)
        //       resolve(result)
        //     })
        //   return
        // }
        if (!result) {
          reject(new Error('draw error!'))
        }
        resolve(result)
      } catch(err: Error) {
        reject(err)
      }
    })
    .catch((err: Error) => {
      reject(err)
    })
  })
}


export function sendPut(url: string, data: string | FormData, headers?: Map<string, any>): Promise<any> {
  return sendRequest(url, data, headers, 'PUT')
}

export function sendPost(url: string, data: string | FormData, headers?: Map<string, any>): Promise<any> {
  return sendRequest(url, data, headers, 'POST')
}

export function sendRequest(url: string, data: string | FormData, headers?: Map<string, any>, method?: string): Promise<any> {
  if (method && !['POST', 'PUT'].includes(method)) {
    throw new Error('http method is not allowed(' + method + ') !!')
  }
  if (typeof(data) !== 'string') {
    headers = { ...data.getHeaders(), ...(headers??{}) }
  }
  const {
    protocol,
    hostname,
    pathname,
    port,
    search
  } = _url.parse(url)
  const options = {
    protocol,
    hostname,
    port,
    method: "POST",
    path: pathname,
    headers,
    search
  }

  const proxy = (protocol === 'http:') ? http : https
  return new Promise<any>((resolve, reject) => {
    const chunks = []
    let size = 0
    const req = proxy.request(options, (res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk)
        size += chunk.length
      })

      res.on('end', () => {
        const data = Buffer.concat(chunks, size)
        resolve({ data: Buffer.isBuffer(data) ? data : data.toString(), headers: res.headers })
      })
    }).on('error', (err) => {
      reject(err)
    })
    if (typeof(data) === 'string') {
      req.write(data)
    } else {
      data.pipe(req)
    }
    req.end()
  })
}

export function sendGet(url: string, options?: any): Promise<any> {
  const proxy = (url.startsWith('http:')) ? http : https
  return new Promise<any>((resolve, reject) => {
    const chunks = []
    let size = 0
    const args = [url]
    if (options) args.push(options)
    args.push((res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk)
        size += chunk.length
      })

      res.on('end', () => {
        const data = Buffer.concat(chunks, size)
        resolve({ data: Buffer.isBuffer(data) ? data : data.toString(), headers: res.headers })
      })
    })
    proxy.get(...args).on('error', (err) => {
      reject(err)
    })
    .end()
  })
}


export async function shortURL(url: string) {
  return new Promise<string>((resolve, reject) => {
    const ip = virtualIP()
    const formData = new FormData()
    formData.append("url", url)
    formData.append("host", "hk")
    formData.append("random", `20305174902795030`)
    // https://www.985.so/
    sendPost(`https://hk.ft12.com/multi.php`, formData, {
      'X-Forwarded-For': ip,
      'Origin': 'https://www.985.so',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
    }).then(({ data: val }) => {
      try {
        const res = JSON.parse(val)
        if (res.status === 1) {
          resolve(res.url)
        } else reject(new Error("Error: genarate short URL fail !!"))
      } catch(err) {
        reject(err)
      }
    }).catch(err => reject(err))
  })
}

export async function md2jpg(nickname: stirng, markdownText: string) {
  const htmlText = await genTemplate(nickname, markdownText)
  const { html2jpg } = config
  const { data } = await sendPost(html2jpg ?? 'http://114.132.201.94:8082/openai/api/html2jpg', str({ htmlText }), {
    'content-type': 'application/json'
  })
  const result = JSON.parse(data)
  // console.log(result)
  if (result.statusCode === 200) {
    return result.data
  } else throw new Error('md2jpg error !')
}

export async function genTemplate(nickname: string, md: string) {
  let short = ""
  const mdText = md
    .replaceAll('<script>', '&lt;script&gt;')
    .replaceAll('</script>', '&lt;/script&gt;')
    .replaceAll(/([^$]{1})\$([^$]{1,})\$/g, '$$$$$2$$$$')
  const markdownText = mdText
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
  // https://hk.ft12.com/multi.php?url=www.985.so
  try {
    const jsonString = `{
      "name": "${nickname}"
    }`
    short = await shortURL('https://bincooo.github.io/cdn/md/index.html?tex=' + btoa(encodeURI(mdText)) + '&d=' + btoa(encodeURI(jsonString)))
    if (config.debug) {
      console.log('short URL: ', short)
    }
  } catch(err: Error) {
    console.log('Error: genarate short URL fail !!')
    console.error(err)
  }
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Marked in the browser</title><link href="default.css"rel="stylesheet"/><link href="github-md.css"rel="stylesheet"/><script src="github-md.js"></script><script src="tex-chtml.js"></script><script src="jquery.min.js"></script><script src="jquery.qrcode.min.js"></script></head><body><div id="header"><div>By ${nickname}</div></div><div id="content"></div><div id="footer"><div class="qrc"><div id="qrcode"></div><div class="md-download"><a href="javascript:d()">点击下载</a></div></div></div><script src="marked.min.js"></script><script>let val="${markdownText}",url="${short}";if(!val){const tex=location.search;if(tex.startsWith('?tex=')){val=decodeURI(atob(tex.substr(5)))}}if(!url){url="https://bincooo.github.io/vuepress-doc"}val=val.replaceAll(/([^$]{1})\$([^$]{1,})\$/g,'$$$$$2$$$$');document.getElementById('content').innerHTML=marked.parse(val);hljs.highlightAll();MathJax.typeset();let codes=document.querySelectorAll('code');codes.forEach(item=>{let lang=item.classList[0]?.split('-')[1];if(lang){item.title=\`[lang:$\{lang}]\`}});$('#qrcode').qrcode({width:120,height:120,background:"#f0f0f0",foreground:"#000000",correctLevel:0,text:url});function download(filename,text){var element=document.createElement('a');element.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(text));element.setAttribute('download',filename);element.style.display='none';document.body.appendChild(element);element.click();document.body.removeChild(element)}function d(){download('marked.md',val)}</script></body></html>`
}

export async function onlineSearch(content: string): Promise<Array> {
  const params = {
    q: content,
    max_results: 3,
    time: 'y',
    region: 'wt-wt'
  }
  try {
    const { data } = await sendGet("https://ddg-webapp-aagd.vercel.app/search?" + encoded(params), {
      // localAddress: '127.0.0.1',
      // localPort: 7890
      agent: new ProxyAgent(config.proxyServer)
    })
    return JSON.parse(data)
  } catch(err) {
    console.log('online search error: ', err)
    throw err
  }
}


/**
 * 4K画质增强
 */
export function _4K(imgUrl: string): Promise<string> {
  const ip = virtualIP()
  return new Promise<string>((resolve, reject) => {
    const fetch = (taskid: string) => {
      if (!taskid) {
        reject(new Error('try fetch 4K Error !!!: taskid is undefined'))
        return
      }
      const createWrap = () => {
        return new Promise<string>((_res, rej) => {
          sendPost('http://transcode.imperial-vision.com:8080/api/transcode/image/fetch',
            encoded({ taskid }),
            {
              'X-Forwarded-For': ip,
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Proxy-Connection': 'keep-alive',
              'Origin': 'http://transcode.imperial-vision.com:8080',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
            }
          ).then(({ data: val }) => {
            try {
              const res = JSON.parse(val)
              if (res.code === 0 && res.msg === 'request success') {
                if (res.data?.status !== 4) {
                  rej(new Error('try fetch 4K Error !!!: outputurl is undefined'))
                } else {
                  _res(res.data?.outputurl)
                }
              }
              else rej(new Error('try fetch 4K Error !!!: ' + val))
            } catch(err) {
              // console.log('try fetch 4K Error !!!: ' + val)
              rej(err)
            }
          }).catch(err => rej(err))
        })
      }

      retry(() => createWrap, 10, 800)
        .then(resolve)
        .catch(reject)
    }

    const doIt = (base64: string) => {
      // console.log('data:image/png;base64,' + base64)
      sendPost('http://transcode.imperial-vision.com:8080/api/transcode/image', encoded({
          "filename": dat() + '.png',
          "ImgBase64_1": 'data:image/png;base64,' + base64
        }), {
          'X-Forwarded-For': ip,
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Proxy-Connection': 'keep-alive',
          'Origin': 'http://transcode.imperial-vision.com:8080',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
        })
      .then(({ data: val }) => {
        try {
          const res = JSON.parse(val)
          if (res.code === 0 && res.msg === 'request success') {
            setTimeout(() => {
              fetch(res.data?.taskid)
            }, 1000)
          }
          else reject(new Error('try 4K Error !!!: ' + val))
        } catch(err) {
          // console.log('try 4K Error !!!: ' + val)
          reject(err)
        }
      })
      .catch(reject)
    }

    sendGet(imgUrl)
      .then(({ data: buffer }) => {
        doIt(buffer.toString('base64'))
      })
  })
}

const str = function(json: any) {
  return JSON.stringify(json)
}

const encoded = function(json: any) {
  const chunks = []
  Object.keys(json).forEach(key => {
    chunks.push(key + '=' + urlencode(json[key]))
  })
  return chunks.join('&')
}

function dat() {
  return new Date()
    .getTime()
}


function virtualIP() {
  return (
    Math.floor(Math.random() * (10 - 255) + 255) +
    '.' +
    Math.floor(Math.random() * (10 - 255) + 255) +
    '.' +
    Math.floor(Math.random() * (10 - 255) + 255) +
    '.' +
    Math.floor(Math.random() * (10 - 255) + 255)
  )
}

