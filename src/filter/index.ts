import { SymbolFilter } from './symbol'
import { TagsHelpFilter } from './tags-help'
import { CatgirlFilter } from './catgirl'


const messageFilters = [
  new SymbolFilter(),
  new TagsHelpFilter(),
  new CatgirlFilter()
]

export default messageFilters