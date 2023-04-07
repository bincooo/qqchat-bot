import { ChatGPTHandler } from './chatgpt'
import { commandHandler } from './command'
import { emptyHandler } from './empty'
import { helpHandler } from './help'
import { NovelAiHandler } from './novel-ai'
import { ignoreHandler } from './ignore'


const messageHandlers = [
  helpHandler,
  emptyHandler,
  commandHandler,
  new NovelAiHandler(),
  ignoreHandler,
  new ChatGPTHandler(),
]

export default messageHandlers
