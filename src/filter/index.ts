import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { OnlineFilter } from './online'
import { CodeFilter } from './code'
import { PlayerMaintenanceFilter } from './player-maintenance'
import { DefaultFilter } from './default'

const messageFilters = [
  new SymbolFilter(),
  new NovelAiFilter(),
  new PlayerFilter(),
  new PlayerMaintenanceFilter(),
  new MdFilter(),
  new OnlineFilter(),
  new CodeFilter(),
  new DefaultFilter()
]

export default messageFilters