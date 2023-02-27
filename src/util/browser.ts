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
    '--window-size=710,350'
    // '--js-flags="--max-old-space-size=1024"'
  ]


  const browser: Browser = await puppeteer.launch({
    headless,
    // devtools: true,
    // defaultViewport: { width: 710, height: 350 },
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

export async function md2jpg(htmlText: string): Promise<string> {
  let [ browser, page ] = await getBrowser(false)
  // let [ browser, page ] = await getBrowser()
  let dontClose = true
  if (!page) {
    page = await browser.newPage()
    dontClose = false
  }

  const html = path.join(path.resolve(), `amr/${genUid()}.html`)
  fs.writeFile(html, htmlText, (err) => {
    if(err) console.log(err)
  })

  await page.goto('file://' + html, {
    waitUntil: 'networkidle0'
  })

  await page.reload()
  const jpg = path.join(path.resolve(), `amr/${genUid()}.jpg`)
  await page.screenshot({ path: jpg, fullPage: true })
  if (!dontClose) {
    // await page.close()
  }
  return fs.readFileSync(jpg)
    .toString('base64')
}