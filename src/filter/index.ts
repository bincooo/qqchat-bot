import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { CodeFilter } from './code'
import { PlayerMaintenancelFilter } from './player-maintenance'

const messageFilters = [
  new SymbolFilter(),
  new NovelAiFilter(),
  new PlayerFilter(),
  new PlayerMaintenancelFilter(),
  new MdFilter(),
  new CodeFilter()
]

export default messageFilters