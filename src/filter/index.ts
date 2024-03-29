import { SymbolFilter } from './symbol'
import { NovelAiFilter } from './novel-ai'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { OnlineFilter } from './online'
import { CodeFilter } from './code'
import { PlayerMaintenanceFilter } from './player-maintenance'
import { DANmodelFilter } from './dan-model'
import { DefaultFilter } from './default'
import { BanFilter } from './ban'

const messageFilters = [
  new BanFilter(),
  new SymbolFilter(),
  new NovelAiFilter(),
  new OnlineFilter(),
  new MdFilter(),
  new CodeFilter(),
  new PlayerFilter(),
  new PlayerMaintenanceFilter(),
  new DANmodelFilter(),
  new DefaultFilter()
]

export default messageFilters