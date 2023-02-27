// import marked from 'marked'
import getBrowser from '../src/util/browser'
import { shortURL } from '../src/util/draw'
import { genTemplate } from '../src/filter/markdown'
import { randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

function genUid(): string {
  return randomBytes(16)
    .toString('hex')
    .toLowerCase()
    .substr(0, 10)
}

async function main() {
  const markdownText = `例如：\n\n$$y' + ycos x = sin x$$\n\n其积分因子为$mu(x) = e^{int cos x dx} = e^{sin x}$，代入公式得：\n\n$$y = \frac{1}{e^{sin x}}(int e^{sin x} sin x dx + C)$$\n\n其中$int e^{sin x} sin x dx$无法用初等函数表示，只能用级数表示。`

  const uid = genUid()
  const html = await genTemplate('折戟沉沙。丿', markdownText)
  const html_path = path.join(__dirname, `../amr/${uid}.html`)
  fs.writeFile(html_path, html, (err) => { console.log('write file Error', err) })
  // console.log(html)
  const [browser, page] = await getBrowser(false)
  await page.setViewport({ width: 710, height: 350 })
  await page.goto('file://' + html_path)
  const jpg = path.join(path.resolve(), `amr/${genUid()}.jpg`)
  await page.screenshot({ path: jpg, fullPage: true })
  console.log('jpg path: ', jpg)
}


async function main1() {
  const path = await shortURL('https://bincooo.github.io/cdn/md/index.html?tex=JTYwJTYwJTYwYyUwQXZvaWQlMjBtdWx0aXBseShjaGFyKiUyMG51bTEsJTIwY2hhciolMjBudW0yLCUyMGNoYXIqJTIwcmVzdWx0KSUwQSU3QiUwQSUyMCUyMCUyMCUyMGludCUyMGxlbjElMjA9JTIwc3RybGVuKG51bTEpOyUwQSUyMCUyMCUyMCUyMGludCUyMGxlbjIlMjA9JTIwc3RybGVuKG51bTIpOyUwQSUyMCUyMCUyMCUyMGludColMjBudW0lMjA9JTIwKGludCopY2FsbG9jKGxlbjElMjArJTIwbGVuMiwlMjBzaXplb2YoaW50KSk7JTBBJTBBJTIwJTIwJTIwJTIwLy8lMjAlRTclQUIlOTYlRTUlQkMlOEYlRTglQUUlQTElRTclQUUlOTclRTQlQjklOTglRTclQTclQUYlRTUlQjklQjYlRTUlQUQlOTglRTUlODIlQTglRTUlOUMlQThudW0lRTYlOTUlQjAlRTclQkIlODQlRTQlQjglQUQlMEElMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaSUyMD0lMjBsZW4xJTIwLSUyMDE7JTIwaSUyMCUzRT0lMjAwOyUyMGktLSklMEElMjAlMjAlMjAlMjAlN0IlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaiUyMD0lMjBsZW4yJTIwLSUyMDE7JTIwaiUyMCUzRT0lMjAwOyUyMGotLSklMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBpbnQlMjBwcm9kdWN0JTIwPSUyMChudW0xJTVCaSU1RCUyMC0lMjAnMCcpJTIwKiUyMChudW0yJTVCaiU1RCUyMC0lMjAnMCcpOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMG51bSU1QmklMjArJTIwaiUyMCslMjAxJTVEJTIwKz0lMjBwcm9kdWN0JTIwJTI1JTIwMTA7JTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwbnVtJTVCaSUyMCslMjBqJTVEJTIwKz0lMjBwcm9kdWN0JTIwLyUyMDEwOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3RCUwQSUyMCUyMCUyMCUyMCU3RCUwQSUwQSUyMCUyMCUyMCUyMC8vJTIwJUU1JUE0JTg0JUU3JTkwJTg2JUU4JUJGJTlCJUU0JUJEJThEJTBBJTIwJTIwJTIwJTIwZm9yJTIwKGludCUyMGklMjA9JTIwbGVuMSUyMCslMjBsZW4yJTIwLSUyMDE7JTIwaSUyMCUzRSUyMDA7JTIwaS0tKSUwQSUyMCUyMCUyMCUyMCU3QiUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGlmJTIwKG51bSU1QmklNUQlMjAlM0U9JTIwMTApJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwbnVtJTVCaSUyMC0lMjAxJTVEJTIwKz0lMjBudW0lNUJpJTVEJTIwLyUyMDEwOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMG51bSU1QmklNUQlMjAlMjU9JTIwMTA7JTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTBBJTIwJTIwJTIwJTIwJTdEJTBBJTBBJTIwJTIwJTIwJTIwLy8lMjAlRTUlQjAlODZudW0lRTYlOTUlQjAlRTclQkIlODQlRTglQkQlQUMlRTYlOEQlQTIlRTYlODglOTAlRTUlQUQlOTclRTclQUMlQTYlRTQlQjglQjIlRTUlQkQlQTIlRTUlQkMlOEYlMEElMjAlMjAlMjAlMjBpbnQlMjBpJTIwPSUyMDA7JTBBJTIwJTIwJTIwJTIwd2hpbGUlMjAobnVtJTVCaSU1RCUyMD09JTIwMCUyMCYmJTIwaSUyMCUzQyUyMGxlbjElMjArJTIwbGVuMiUyMC0lMjAxKSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGkrKzslMEElMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaiUyMD0lMjAwOyUyMGklMjAlM0MlMjBsZW4xJTIwKyUyMGxlbjI7JTIwaSsrLCUyMGorKyklMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjByZXN1bHQlNUJqJTVEJTIwPSUyMG51bSU1QmklNUQlMjArJTIwJzAnOyUwQSUyMCUyMCUyMCUyMHJlc3VsdCU1QmxlbjElMjArJTIwbGVuMiUyMC0lMjBpJTVEJTIwPSUyMCclMDAnOyUwQSUyMCUyMCUyMCUyMGZyZWUobnVtKTslMEElN0QlMEElNjAlNjAlNjA=')
  console.log(path)
}

main()
// .then(() => process.exit(1))