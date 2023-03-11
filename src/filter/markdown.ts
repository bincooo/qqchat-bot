import { BaseMessageFilter } from 'src/types'
import { Sender } from 'src/model/sender'
import { segment } from 'oicq'
import { md2jpg } from 'src/util/browser'
import { config } from 'src/config'
import { shortURL } from 'src/util/request'

const str = '```'

export class MdFilter extends BaseMessageFilter {
  protected _isMarkdown: boolean = false
  protected _isCode: boolean = false
  protected _messageContiner: Array<string> = []
  constructor() {
    super()
    this.type = 1
  }

  handle = async (content: string, sender?: Sender, done?: boolean) => {
    if (!!content) [ true, content ]

    let index = 0
    const methods = [
      'assert_one',
      'assert_two',
      'assert_three',
      'assert_four',
      'assert_five'
    ]
    while(index < methods.length) {
      const [ match, result ] = await (this[methods[index]].call(this, content, sender, done))
      if (match) {
        return [ false, result ]
      }
      index++
    }
    return [ true, content ]
  }

  async assert_one(content: string, sender?: Sender, done: boolean): (boolean | string)[] {
    if (config.debug) {
      console.log('markdown =====> [' + done + ']', content)
    }

    const doit = async () => {
      if (config.debug) {
        console.log('_messageContiner', this._messageContiner.join('\n'))
      }
      await this.__md2jpg(sender, this._messageContiner.join('\n'))
      this._messageContiner = []
      return [ true, '' ]
    }

    if (content?.trim().startsWith('[markdown]')) {
      this._isMarkdown = true
      this._messageContiner = []
      this._messageContiner.push(content?.trim().substr(10))
      if (done) {
        return await doit()
      }
      return [ true, '' ]
    }

    if (this._isMarkdown) {
      this._messageContiner.push(content)
      if (done) {
        this._isMarkdown = false
        return await doit()
      }
      return [ true, '' ]
    }

    return [ false, content ]
  }

  /**
   * is markdown start block
   */
  async assert_two(content: string, sender?: Sender, done: boolean): (boolean | string)[] {
    const match = (!this._isCode && content.endsWith(str))
    if (match) {
      this._isCode = true
      this._messageContiner = []
      const result = content.substr(0, content.length - str.length)
      return [ true, result ]
    }
    return [ false, content ]
  }

  /**
   * is markdown end block
   */
  async assert_three(content: string, sender?: Sender, done: boolean): boolean {
    const match = (this._isCode && content.endsWith(str))
    if (match) {
      this._isCode = false
      this._messageContiner.push(content)
      if (config.debug) {
        console.log('_messageContiner', this._messageContiner.join('\n'))
      }
      await this.__md2jpg(sender, [ str, this._messageContiner.join('\n') ].join(''))
      return [ true, '' ]
    }
    return [ false, content ]
  }

  /**
   * unknown
   */
  async assert_four(content: string, sender?: Sender, done: boolean) {
    if (done) {
      if (this._isCode) {
        this._isCode = false
        this._messageContiner.push(content)
        if (config.debug) {
          console.log('_messageContiner', this._messageContiner.join('\n'))
        }
        await this.__md2jpg(sender, [ str, this._messageContiner.join('\n'), '\n', str ].join(''))
        return [ true, '' ]
      }
      this._isCode = false
    }
    return [ false, content ]
  }

  /**
   * message Container
   */
  assert_five(content: string, done: boolean) {
    if (this._isCode) {
      this._messageContiner.push(content)
      return [ true, '' ]
    }
    return [ false, content ]
  }


  async __md2jpg(sender: Sender, content: string) {
    const b = '```markdown'
    if (content.startsWith(b)) {
      content = content.substr(b.length)
      content = content.substr(0, content.length - 3)
    }
    try {
      const b64 = await md2jpg((await genTemplate(sender.nickname, content)))
      switch (config.type) {
        case "mirai":
          sender.reply([{ type: 'Image', base64: b64 }], true)
          break
        default:
          sender.reply(segment.image('base64://' + b64), true)
          break
      }
    } catch(error: Error) {
      sender.reply('——————————————\nError: 4002\n' + error + '\n\n生成markdown图片失败辣 ...', true)
    }
  }
}

export async function genTemplate(nickname: string, md: string) {
  let short = ""
  const mdText = md
    .replaceAll('"', '\\"')
    .replaceAll(/([^$]{1})\$([^$]{1,})\$/g, '$$$$$2$$$$')
  const markdownText = mdText
    .replaceAll('\\', '\\\\')
    .replaceAll('\\\\"', '\\"')
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