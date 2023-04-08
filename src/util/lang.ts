
abstract class AbstractUnicodeParser {
  filter(str: string) : string
}

class JapaneseUnicodeParser extends AbstractUnicodeParser {
  protected _interval: Array<{ l: number, r: number }> = [
      { l: 0x3000, r: 0x303f },
      { l: 0x3040, r: 0x309F },
      { l: 0x30A0, r: 0x30FF }
      // { l: 0x4E00, r: 0x9FBF }
    ]

  assert(code: number): boolean {
    for(let index = 0; index < this._interval.length; index++) {
      const interval = this._interval[index]
      if (code >= interval.l && code <= interval.r) {
        return true
      }
    }
    return false
  }

  count(str: string): number {
    let count = 0
    for(let index = 0; index < str.length; index++) {
      const code = str.charCodeAt(index)
      if (this.assert(code)) {
        count++
      }
    }
    return count
  }

  filter(str: string): string {
    return str
      .replace(/[0-9\s\n]+/g, '')
      .replace(/[`:_.~!@#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g, '')
  }
}

class SpeakUnicodeParser extends AbstractUnicodeParser {
  filter(str: string): string {
    // 过滤表情符号
    const regex = /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/g
    return str.replaceAll('*', '')
      .replaceAll(regex, '')
      .replaceAll('【', '')
      .replaceAll('】', '')
      .trim()
  }
}

class R18UnicodeParser extends AbstractUnicodeParser {
  filter(str: string) {
    let result = str
    for(let index = 0, length = R18_ENTRY.length; index < length; index ++) {
      const r18 = R18_ENTRY[index]
      result = result.replaceAll(r18.key, r18.value)
    }
    return result
  }
}

export const japaneseUnicodeParser = new JapaneseUnicodeParser()
export const speakUnicodeParser = new SpeakUnicodeParser()
export const r18UnicodeParser = new R18UnicodeParser()

const R18_ENTRY = [
{ key: '\u5185\u88e4', value: '\u80d6\u6b21' },
{ key: '\u8089\u68d2', value: 'r\u68d2' },
{ key: '\u80f8\u90e8', value: 'x\u90e8' },
{ key: '\u79c1\u5904', value: 'si\u5904' },
{ key: '\u9ad8\u6f6e', value: 'g\u6f6e' },
{ key: '\u4e73\u623f', value: 'ru\u623f' },
{ key: '\u5feb\u611f', value: 'k\u611f' },
{ key: '\u547b\u541f', value: 's\u541f' },
{ key: '\u9f9f\u5934', value: 'g\u5934' },
{ key: '\u5c0f\u7a74', value: 'x\u7a74' },
{ key: '\u81ea\u6170', value: 'z\u6170' },
{ key: '\u53e3\u4ea4', value: 'k-jiao' },
{ key: '\u6027\u4ea4', value: 'x-jiao' },
{ key: '\u6027\u7231', value: 'x\u7231' },
{ key: '\u6027\u884c\u4e3a', value: 'x\u884c\u4e3a' },
{ key: '\u8089\u4fbf\u5668', value: 'r\u4fbf\u5668' },
{ key: /(\u63d2|\u64cd|\u8349|\u8279)/g, value: 'c' },
{ key: /(\u6deb|\u9634|\u9633|\u763e)/g, value: 'y' },
  ]
