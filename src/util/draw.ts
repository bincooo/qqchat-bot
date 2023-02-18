import http from 'http'
import _url from 'url'
import urlencode from 'urlencode'
import retry from './retry'


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

/**
 * NovalAI
 */
export function draw(opts: {
  session_hash: string
  fn_index?: number
  data: Array<any>
  try4K?: boolean
}): Promise<string> {

  const {
    data,
    session_hash,
    fn_index = 101,
    try4K = false
  } = opts

  return new Promise<string>((resolve, reject) => {
    sendPost('http://mccn.pro:7860/run/predict', 
      JSON.stringify({
        data,
        session_hash,
        fn_index
      }),
      {
        'Content-Type': 'application/json',
        'Proxy-Connection': 'keep-alive',
        'Origin': 'http://mccn.pro:7860',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
      })
    .then((res) => {
      try {
        let path = JSON.parse(res).data[0][0]?.name
        if (!path) {
          console.log("NovalAI:Error", res)
          reject(new Error("NovalAI:Error [not path]:: " + res))
          return
        }
        path = ('http://mccn.pro:7860/file=' + path)
        if (try4K) {
          _4K(path)
            .then(url => {
              if (url) {
                resolve(url)
              } else {
                resolve(path)
              }
            })
            .catch(err => {
              resolve(path)
            })
          return
        }
        resolve(path)
      } catch(err) {
         reject(err)
      }
    })
    .catch(err => reject(err))
  })
}

export function reset(hash: string) {
  return new Promise<string>((resolve, reject) => {
    sendPost('http://mccn.pro:7860/run/predict', 
      JSON.stringify({
        data: [],
        fn_index: 270,
        session_hash: hash
      }),
      {
        'Content-Type': 'application/json',
        'Proxy-Connection': 'keep-alive',
        'Origin': 'http://mccn.pro:7860',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/110.0.1587.41'
      })
    .then((res) => {
      resolve('ok')
    })
    .catch(err => reject(err))
  })
}


function sendPost(url: string, dataString: string, headers?: Map<string, any>): Promise<any> {
  const {
    protocol,
    hostname,
    pathname,
    port
  } = _url.parse(url)
  const options = {
    protocol,
    hostname,
    port,
    method: "POST",
    path: pathname,
    headers
  }

  return new Promise<any>((resolve, reject) => {
    const chunks = []
    let size = 0
    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk)
        size += chunk.length
      })

      res.on('end', () => {
        const data = Buffer.concat(chunks, size)
        resolve(Buffer.isBuffer(data) ? data : data.toString())
      })
    }).on('error', (err) => {
      reject(err)
    })
    req.write(dataString)
    req.end()
  })
}

function sendGet(url: string): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const chunks = []
    let size = 0
    http.get(url, (res) => {
      res.on('data', (chunk) => {
        chunks.push(chunk)
        size += chunk.length
      })

      res.on('end', () => {
        const data = Buffer.concat(chunks, size)
        resolve(Buffer.isBuffer(data) ? data : data.toString())
      })
    }).on('error', (err) => {
      reject(err)
    })
    .end()
  })
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
          ).then(val => {
            try {
              const res = JSON.parse(val)
              console.log(res)
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

      retry(createWrap, 10, 800)
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
      .then(val => {
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
      .then(buffer => {
        doIt(buffer.toString('base64'))
      })
  })
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

