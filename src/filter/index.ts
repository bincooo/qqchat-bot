import { SymbolFilter } from './symbol'
import { TagsHelpFilter } from './tags-help'
import { CatgirlFilter } from './catgirl'
import { MdFilter } from './markdown'

const messageFilters = [
  new SymbolFilter(),
  new TagsHelpFilter(),
  new CatgirlFilter(),
  new MdFilter()
]

export default messageFilters