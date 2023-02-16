import HelpCommand from './help'
import CgptCommand from './cgpt'
import OfficialCommand from './official'
import ServerCommand from './server'

export default [
  new HelpCommand(),
  new CgptCommand(),
  new ServerCommand(),
  new OfficialCommand()
]
