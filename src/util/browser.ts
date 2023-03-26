import delay from 'delay'
import type { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import { randomBytes } from 'crypto'
import path from 'path'
import fs from 'fs'
import os from 'os'


function genUid(): string {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
    .substr(0, 10)
}


let DEFAULT_BROWSER: null | Browser = null
export default async function getBrowser(headless?: boolean = true): (Browser | Page)[] {
  if (DEFAULT_BROWSER) return [DEFAULT_BROWSER, null]

  const puppeteerArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
    '--ignore-certificate-errors',
    '--no-first-run',
    '--no-service-autorun',
    '--password-store=basic',
    '--system-developer-mode',
    // the following flags all try to reduce memory
    // '--single-process',
    '--mute-audio',
    '--disable-default-apps',
    '--no-zygote',
    '--disable-accelerated-2d-canvas',
    '--disable-web-security',
    '--disable-gpu',
    '--window-size=650,350'
    // '--js-flags="--max-old-space-size=1024"'
  ]


  const browser: Browser = await puppeteer.launch({
    headless,
    // devtools: true,
    defaultViewport: { width: 650, height: 350 },
    args: puppeteerArgs,
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--enable-automation',
      '--disable-component-extensions-with-background-pages'
    ],
    ignoreHTTPSErrors: true,
    executablePath: defaultChromeExecutablePath()
  })

  const [ page ] = await browser.pages()
  DEFAULT_BROWSER = browser
  return [ browser, page ]
}


export const defaultChromeExecutablePath = (): string => {
  // return executablePath()

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  switch (os.platform()) {
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

    default: {
      /**
       * Since two (2) separate chrome releases exist on linux, we first do a
       * check to ensure we're executing the right one.
       */
      const chromeExists = fs.existsSync('/usr/bin/google-chrome')

      return chromeExists
        ? '/usr/bin/google-chrome'
        : '/usr/bin/google-chrome-stable'
    }
  }
}

export async function genTemplate(nickname: string, md: string) {
  let short = ""
  const mdText = md
    .replaceAll('<script>', '&lt;script&gt;')
    .replaceAll('</script>', '&lt;/script&gt;')
    .replaceAll(/([^$]{1})\$([^$]{1,})\$/g, '$$$$$2$$$$')
  const markdownText = mdText
    .replaceAll('"', '\\"')
    // .replaceAll('\\', '\\\\')
    // .replaceAll('\\\\"', '\\"')
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

export async function md2jpg(htmlText: string): Promise<string> {
  // let [ browser, page ] = await getBrowser(false)
  let [ browser, page ] = await getBrowser()
  let dontClose = true
  if (!page) {
    page = await browser.newPage()
    dontClose = false
  }

  const html = path.join(path.resolve(), `amr/${genUid()}.html`)
  fs.writeFile(html, htmlText, (err) => {
    if(err) console.log(err)
  })

  try{
    await page.goto('file://' + html, {
      waitUntil: 'networkidle0'
    })
  } catch(err) {
    console.log('page.goto >> files://' + html, err)
    await page.evaluate(() => window.stop())
  }
  await page.reload()
  const jpg = path.join(path.resolve(), `amr/${genUid()}.jpg`)
  await page.screenshot({ path: jpg, fullPage: true })
  if (!dontClose) {
    await page.close()
  }
  return fs.readFileSync(jpg)
    .toString('base64')
}