import { SymbolFilter } from './symbol'
import { TagsHelpFilter } from './tags-help'
import { PlayerFilter } from './player'
import { MdFilter } from './markdown'
import { CodeFilter } from './code'

const messageFilters = [
  new SymbolFilter(),
  new TagsHelpFilter(),
  new PlayerFilter(),
  new MdFilter(),
  new CodeFilter()
]

export default messageFilters