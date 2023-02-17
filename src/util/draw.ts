import http from 'http'
import _url from 'url'


/**
 * NovalAI
 */
export function draw(opts: {
  session_hash: string
  fn_index?: number
  data: Array<any>
}): Promise<string> {

  const {
    data,
    session_hash,
    fn_index = 101
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
      const path = res.data[0][0]?.name
      if (!path) {
        console.log("NovalAI:Error", res)
        reject(new Error("NovalAI:Error:: " + JSON.parse(res)))
      }
      resolve('http://mccn.pro:7860/file=' + path)
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

  const isJson = (headers 
    && headers['Content-Type'] 
    && headers['Content-Type'].includes('application/json'))

  return new Promise<any>((resolve, reject) => {
    let data = ''
    const req = http.request(options, (res) => {
      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          resolve(isJson ? JSON.parse(data) : data)
        } catch(err) {
          reject(err)
          console.log('respose', data)
          console.log('draw error', err)
        }
      })
    }).on('error', (err) => {
      reject(err)
    })
    req.write(dataString)
    req.end()
  })
}