

class JapaneseUnicodeParser {
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
}

export const japaneseUnicodeParser = new JapaneseUnicodeParser()