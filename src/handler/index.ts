import { ChatGPTHandler } from './chatgpt'
import { commandHandler } from './command'
import { emptyHandler } from './empty'
import { helpHandler } from './help'
import { NovelAiHandler } from './novel-ai'
import { ignoreHandler } from './ignore'
import { ClaudeHandler } from './claude'


const messageHandlers = [
  helpHandler,
  emptyHandler,
  commandHandler,
  new NovelAiHandler(),
  ignoreHandler,
  new ChatGPTHandler(),
  new ClaudeHandler(),
]

export default messageHandlers
