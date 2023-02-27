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
  const markdownText = `# 简历

## 个人信息
- 姓名：李田所
- 年龄：24岁
- 性别：男
- 学历：本科
- 毕业时间：2023年6月
- 专业：新闻传播学

## 联系方式
- 手机号码：13912345678
- 邮箱：litiansuo@email.com

## 求职意向
- 应聘岗位：科技新闻编辑
- 求职公司：HOMO之家

## 教育背景
- 学校：某大学
- 时间：2019年-2023年
- 专业：新闻传播学

## 工作经历
- 公司：某会员制餐厅
- 时间：2020年-2021年
- 职位：服务员

## 爱好
- 喜欢喝红茶
- 经常健身`

  const uid = genUid()
  const html = await genTemplate('折戟沉沙。丿', markdownText)
  fs.writeFile(`../amr/${uid}.html`, html, (err) => { console.log('write file Error', err) })
  // console.log(html)
  const [browser, page] = await getBrowser()
  const html_path = path.join(__dirname, `../amr/${uid}.html`)
  await page.goto('file://' + html_path)
  console.log('html path: ', html_path)
}


async function main1() {
  const path = await shortURL('https://bincooo.github.io/cdn/md/index.html?tex=JTYwJTYwJTYwYyUwQXZvaWQlMjBtdWx0aXBseShjaGFyKiUyMG51bTEsJTIwY2hhciolMjBudW0yLCUyMGNoYXIqJTIwcmVzdWx0KSUwQSU3QiUwQSUyMCUyMCUyMCUyMGludCUyMGxlbjElMjA9JTIwc3RybGVuKG51bTEpOyUwQSUyMCUyMCUyMCUyMGludCUyMGxlbjIlMjA9JTIwc3RybGVuKG51bTIpOyUwQSUyMCUyMCUyMCUyMGludColMjBudW0lMjA9JTIwKGludCopY2FsbG9jKGxlbjElMjArJTIwbGVuMiwlMjBzaXplb2YoaW50KSk7JTBBJTBBJTIwJTIwJTIwJTIwLy8lMjAlRTclQUIlOTYlRTUlQkMlOEYlRTglQUUlQTElRTclQUUlOTclRTQlQjklOTglRTclQTclQUYlRTUlQjklQjYlRTUlQUQlOTglRTUlODIlQTglRTUlOUMlQThudW0lRTYlOTUlQjAlRTclQkIlODQlRTQlQjglQUQlMEElMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaSUyMD0lMjBsZW4xJTIwLSUyMDE7JTIwaSUyMCUzRT0lMjAwOyUyMGktLSklMEElMjAlMjAlMjAlMjAlN0IlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaiUyMD0lMjBsZW4yJTIwLSUyMDE7JTIwaiUyMCUzRT0lMjAwOyUyMGotLSklMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlN0IlMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjBpbnQlMjBwcm9kdWN0JTIwPSUyMChudW0xJTVCaSU1RCUyMC0lMjAnMCcpJTIwKiUyMChudW0yJTVCaiU1RCUyMC0lMjAnMCcpOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMG51bSU1QmklMjArJTIwaiUyMCslMjAxJTVEJTIwKz0lMjBwcm9kdWN0JTIwJTI1JTIwMTA7JTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwbnVtJTVCaSUyMCslMjBqJTVEJTIwKz0lMjBwcm9kdWN0JTIwLyUyMDEwOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCU3RCUwQSUyMCUyMCUyMCUyMCU3RCUwQSUwQSUyMCUyMCUyMCUyMC8vJTIwJUU1JUE0JTg0JUU3JTkwJTg2JUU4JUJGJTlCJUU0JUJEJThEJTBBJTIwJTIwJTIwJTIwZm9yJTIwKGludCUyMGklMjA9JTIwbGVuMSUyMCslMjBsZW4yJTIwLSUyMDE7JTIwaSUyMCUzRSUyMDA7JTIwaS0tKSUwQSUyMCUyMCUyMCUyMCU3QiUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGlmJTIwKG51bSU1QmklNUQlMjAlM0U9JTIwMTApJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdCJTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwbnVtJTVCaSUyMC0lMjAxJTVEJTIwKz0lMjBudW0lNUJpJTVEJTIwLyUyMDEwOyUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMG51bSU1QmklNUQlMjAlMjU9JTIwMTA7JTBBJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTIwJTdEJTBBJTIwJTIwJTIwJTIwJTdEJTBBJTBBJTIwJTIwJTIwJTIwLy8lMjAlRTUlQjAlODZudW0lRTYlOTUlQjAlRTclQkIlODQlRTglQkQlQUMlRTYlOEQlQTIlRTYlODglOTAlRTUlQUQlOTclRTclQUMlQTYlRTQlQjglQjIlRTUlQkQlQTIlRTUlQkMlOEYlMEElMjAlMjAlMjAlMjBpbnQlMjBpJTIwPSUyMDA7JTBBJTIwJTIwJTIwJTIwd2hpbGUlMjAobnVtJTVCaSU1RCUyMD09JTIwMCUyMCYmJTIwaSUyMCUzQyUyMGxlbjElMjArJTIwbGVuMiUyMC0lMjAxKSUwQSUyMCUyMCUyMCUyMCUyMCUyMCUyMCUyMGkrKzslMEElMjAlMjAlMjAlMjBmb3IlMjAoaW50JTIwaiUyMD0lMjAwOyUyMGklMjAlM0MlMjBsZW4xJTIwKyUyMGxlbjI7JTIwaSsrLCUyMGorKyklMEElMjAlMjAlMjAlMjAlMjAlMjAlMjAlMjByZXN1bHQlNUJqJTVEJTIwPSUyMG51bSU1QmklNUQlMjArJTIwJzAnOyUwQSUyMCUyMCUyMCUyMHJlc3VsdCU1QmxlbjElMjArJTIwbGVuMiUyMC0lMjBpJTVEJTIwPSUyMCclMDAnOyUwQSUyMCUyMCUyMCUyMGZyZWUobnVtKTslMEElN0QlMEElNjAlNjAlNjA=')
  console.log(path)
}

main()
.then(() => process.exit(1))