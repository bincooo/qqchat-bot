import { ChatGPTOfficialHandler } from './chatgpt-official'
import { ChatGPTHandler } from './chatgpt'
import { commandHandler } from './command'
import { emptyHandler } from './empty'
import { helpHandler } from './help'
import { NovelAiHandler } from './novel-ai'


const messageHandlers = [
  helpHandler,
  emptyHandler,
  commandHandler,
  new NovelAiHandler(),
  ////////////////new ChatGPTHandler(),
  new ChatGPTOfficialHandler()
]

export default messageHandlers
