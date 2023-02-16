import { ChatGPTOfficialHandler } from './chatgpt-official'
import { ChatGPTHandler } from './chatgpt'
import { commandHandler } from './command'
import { emptyHandler } from './empty'
import { helpHandler } from './help'


const messageHandlers = [
  emptyHandler,
  helpHandler,
  commandHandler,
  new ChatGPTHandler(),
  new ChatGPTOfficialHandler()
]

export default messageHandlers
