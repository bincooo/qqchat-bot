import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { CodeFilter } from './code'
import { PlayerMaintenanceFilter } from './player-maintenance'
import { DefaultFilter } from './default'

const messageFilters = [
  new SymbolFilter(),
  new NovelAiFilter(),
  new PlayerFilter(),
  new PlayerMaintenanceFilter(),
  new MdFilter(),
  new CodeFilter(),
  new DefaultFilter()
]

export default messageFilters