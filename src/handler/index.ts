import { ChatGPTOfficialHandler } from './chatgpt-official'
import { ChatGPTHandler } from './chatgpt'
import { commandHandler } from './command'
import { emptyHandler } from './empty'
import { helpHandler } from './help'


const messageHandlers = [
  helpHandler,
  emptyHandler,
  commandHandler,
  new ChatGPTHandler(),
  new ChatGPTOfficialHandler()
]

export default messageHandlers
