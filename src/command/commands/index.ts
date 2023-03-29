import HelpCommand from './help'
import CgptCommand from './cgpt'
import ServerCommand from './server'
import PlayerCommand from './player'

export default [
  new HelpCommand(),
  new CgptCommand(),
  new ServerCommand(),
  new PlayerCommand()
]
