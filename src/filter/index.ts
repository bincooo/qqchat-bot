import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { CodeFilter } from './code'

const messageFilters = [
  new SymbolFilter(),
  new NovelAiFilter(),
  new PlayerFilter(),
  new MdFilter(),
  new CodeFilter()
]

export default messageFilters