import http from 'http'
import https from 'https'
import FormData from 'form-data'
import _url from 'url'
import urlencode from 'urlencode'
import getBrowser from './browser'
import retry from './retry'
import type { Browser, Page } from 'puppeteer'
import { intercept, patterns } from 'puppeteer-interceptor'
import prettier from 'prettier'

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

// api 要是再变，劳资不玩了
async function initMccnPro(): Promise<{ fn_index: number, cookie: string }> {
  if (!_globalThis.mccnPro.page) {
    const [ browser, page ] = await getBrowser()
    _globalThis.mccnPro.page = page ? page : (await browser.newPage())
  }

  return new Promise<{ fn_index: number, cookie: string }>(async (resolve, reject) => {
    if (_globalThis.mccnPro.expires > dat()) {
      resolve({
        cookie: _globalThis.mccnPro.cookie,
        fn_index: _globalThis.mccnPro.fn_index
      })
      return
    }

    const curr = dat()
    let timer = null
    timer = setInterval(() => {
      if (curr + 30000 < dat()) {
        clearInterval(timer)
        reject(new Error('initMccnPro Error: timeout !!!'))
      }
    }, 300)

    intercept(_globalThis.mccnPro.page, patterns.XHR('http://mccn.pro:7860/run/predict/'), {
      onResponseReceived: event => {
        const data = (event.request.postData.match(/"data":\["task\([0-9a-zA-Z]+\)"+/g)??[])[0]
        if (data) {
          console.log(`${event.request.url} // intercepted, going to modify`)
          const fn_index = (event.request.postData.match(/"fn_index":([0-9]+)/i)??[])[1]
          _globalThis.mccnPro.fn_index = fn_index
          _globalThis.mccnPro.cookie = event.request.headers.Cookie
          _globalThis.mccnPro.expires = dat() + (1000 * 60 * 58)
          clearInterval(timer)
          resolve({
            fn_index,
            cookie: event.request.headers.Cookie
          })
        }
        return event.response
      }
    })

    await _globalThis.mccnPro.page.goto('http://mccn.pro:7860', {
      waitUntil: 'networkidle0'
    })

    await _globalThis.mccnPro.page.evaluate(() => {
      const btm = document.querySelector("body > gradio-app")
        .shadowRoot
        .querySelector("#txt2img_generate")
      console.log('btm', btm)
      btm.click()
    })
  })
}

/**
 * NovalAI
 */
export function mccnProDraw(opts: {
  session_hash: string
  // fn_index?: number
  data: Array<any>
  try4K?: boolean
  callback?: () => void
}): Promise<string> {

  const {
    data,
    session_hash,
    // fn_index = 667,
    try4K = false,
    callback
  } = opts
  // console.log('params:', { data,session_hash, fn_index, try4K, callback })

  return new Promise<string>((resolve, reject) => {
    initMccnPro().then(({ fn_index, cookie }) => {
      sendPost('http://mccn.pro:7860/run/predict',
        JSON.stringify({
          data,
          session_hash,
          fn_index
        }),
        {
          'Cookie': cookie,
          'Content-Type': 'application/json',
          'Proxy-Connection': 'keep-alive',
          'Origin': 'http://mccn.pro:7860',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
        })
      .then(({ data: res }) => {
        try {
          let path = ((JSON.parse(res).data??[])[0]??[])[0]?.name
          if (!path) {
            reject(new Error("NovalAI:Error [not path]:: " + res))
            return
          }
          path = ('http://mccn.pro:7860/file=' + path)
          if (try4K) {
            if (callback) {
              callback()
            }

            // _4K(path)
            //   .then(url => {
            //     if (url) {
            //       sendGet(url).then(buffer => {
            //         resolve('base64://' + buffer.toString('base64'))
            //       })
            //     } else {
            //       resolve(path)
            //     }
            //   })
            //   .catch(err => {
            //     resolve(path)
            //   })

            retry(() => tryBetter(path), 3, 800)
              .then(b64 => {
                if (b64) {
                  resolve('base64://' + b64)
                } else resolve(path)
              })
              .catch((err) => {
                console.log(err)
                resolve(path)
              })
            return
          }

          sendGet(path).then(({ data }) => {
            resolve('base64://' + data.toString('base64'))
          }).catch(err => reject(err))
        } catch(err) {
           reject(err)
        }
      }).catch(err => reject(err))
    }).catch(err => reject(err))
  })
}

export async function mccnProReboot() {
  await _globalThis.mccnPro.page?.evaluate(() => {
    const btm = document.querySelector("body > gradio-app")
      .shadowRoot
      .querySelector("#tabs > div.flex.border-b-2.flex-wrap.dark\\:border-gray-700 > button.bg-white.px-4.pb-2.pt-1\\.5.rounded-t-lg.border-gray-200.-mb-\\[2px\\].border-2.border-b-0")
    console.log('btm', btm)
    btm.click()
  })

  await _globalThis.mccnPro.page?.evaluate(() => {
    const btm = document.querySelector("body > gradio-app")
      .shadowRoot
      .querySelector("#settings_restart_gradio")
    console.log('btm', btm)
    btm.click()
  })

  resolve('ok')
}


export function sendPost(url: string, data: string | FormData, headers?: Map<string, any>): Promise<any> {
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

export function sendGet(url: string): Promise<any> {
  const proxy = (url.startsWith('http:')) ? http : https
  return new Promise<any>((resolve, reject) => {
    const chunks = []
    let size = 0
    proxy.get(url, (res) => {
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
    .end()
  })
}

/**
 * 初始化佐糖网址 - 画质提升
 */
async function initPicwishCn() {
  if (!_globalThis.spider.picwishCn) {
    const [browser, page] = await getBrowser()
    _globalThis.spider.picwishCn = page ? page : await browser.newPage()
  } else {
    return
  }

  const readline = (str: string, regex: RegExp, callback: (idx: number, line: string, container: Array<string>) => boolean /* true: stop */) => {
    const list = prettier.format(str, { semi: false, parser: "babel" })
      .split('\n')
    for(let i = 0; i < list.length; i++) {
      // console.log('new line: ', list[i])
      if (regex.test(list[i]) && callback(i, list[i], list)) {
        return
      }
    }
  }

  intercept(_globalThis.spider.picwishCn, patterns.Script('*/astro/picwish/hoisted.*.js'), {
    onResponseReceived: event => {
      console.log(`${event.request.url} // intercepted, going to modify`)
      let he:string
      readline(event.response.body, /await [^(]{1,}\("#first-section\"\)/i, (index, line, container) => {
        for(let i = 1; i <= 5; i++) {
          he = ((container[index - i]).match(/[\s]+([^(]{1,})\(\)/i)??[])[1]
          if (he) break
        }
        return true
      })
      event.response.body += `
        window.picwishCn = {
          he: ${he},
          ...window.picwishCn
        }
      `
      return event.response
    }
  })

  intercept(_globalThis.spider.picwishCn, patterns.Script('*/astro/picwish/chunks/EnhancePreview.*.js'), {
    onResponseReceived: event => {
      console.log(`${event.request.url} // intercepted, going to modify`)
      let Ba:string
      readline(event.response.body, /\.value = Math\.floor\(/i, (index, line, container) => {
        // source: " } = await Ba(await i(q), (F) => (p.value = Math.floor(F * 0.95)))"
        Ba = (line.match(/= await ([^(]{1,})\(await/i)??[])[1]
        if (Ba) return true

        for(let i = 1; i <= 5; i++) {
          Ba = ((container[index - i]).match(/= await ([^(]{1,})\(/i)??[])[1]
          // console.log(container[index - i], Ba)
          if (Ba) break
        }
        return true
      })
      event.response.body += `
        window.picwishCn = {
          Ba: ${Ba},
          ...window.picwishCn
        }
      `
      return event.response
    }
  })

  await _globalThis.spider.picwishCn.goto('https://picwish.cn/photo-enhancer', {
    waitUntil: 'networkidle0'
  })
}

// 比web chatgpt先初始化
// initPicwishCn()

export async function tryBetter(imgUrl: string): Promise<string> {
  await initPicwishCn()
  const { data } = (await sendGet(imgUrl))
  const b64 = data.toString('base64')
  // console.log('b64', b64)
  const { result } = await _globalThis.spider.picwishCn.evaluate(browserTryBetter, b64, `image${dat()}.png`)
  if (result && result.state === 1) {
    const { data: d } = await sendGet(result.image)
    return d?.toString('base64')
  }
  throw new Error('try better error !!!!')
  // result.image
}


async function browserTryBetter(b64: string, name: string) {
  globalThis.__name = () => undefined
  function file() {
    let b = atob(b64),
    len = b.length
    const buf = new Uint8Array(len)
    while(len--) {
      buf[len] = b.charCodeAt(len)
    }
    return new File([buf], name)
  }

  function waitReady() {
    return new Promise((resolve, reject) => {
      let timer = null,
        count = 10
      timer = setInterval(() => {
        if (picwishCn.Ba || 0 > count--) {
          clearInterval(timer)
          resolve()
        }
      }, 500)
    })
  }

  picwishCn.he()
  await waitReady()
  const result = await picwishCn.Ba(file(), f => {
    // console.log('progress: ', Math.floor(f * .95))
  })
  return result
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


export async function onlineSearch(content: string): Promise<Array> {
  const params = {
    q: content,
    max_results: 3,
    time: 'y',
    region: 'wt-wt'
  }
  try {
    const { data } = await sendGet("https://ddg-webapp-aagd.vercel.app/search?" + encoded(params))
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

