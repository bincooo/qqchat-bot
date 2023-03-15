import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { OnlineFilter } from './online'
import { CodeFilter } from './code'
import { PlayerMaintenanceFilter } from './player-maintenance'
import { DANmodelFilter } from './dan-model'
import { DefaultFilter } from './default'

const messageFilters = [
  new SymbolFilter(),
  new NovelAiFilter(),
  new OnlineFilter(),
  new MdFilter(),
  new CodeFilter(),
  new PlayerFilter(),
  new DANmodelFilter(),
  new PlayerMaintenanceFilter(),
  new DefaultFilter()
]

export default messageFilters