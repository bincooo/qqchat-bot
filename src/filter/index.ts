import { SymbolFilter } from './symbol'
import { TagsHelpFilter } from './tags-help'
import { CatgirlFilter } from './catgirl'
import { MdFilter } from './markdown'
import { CodeFilter } from './code'

const messageFilters = [
  new SymbolFilter(),
  new TagsHelpFilter(),
  new CatgirlFilter(),
  new MdFilter(),
  new CodeFilter()
]

export default messageFilters