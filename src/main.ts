import { BaseMessageHandler } from 'src/types'
import logger from './util/log'
import getClient from './core'
import MessageHandlers from './handler'
import { existsConfig, loadConfig, writeConfig, loadPresets } from './util/config'
import { config } from './config'
import { run } from './auto'
import chalk from 'chalk'

/**
 * 触发handler load钩子
 */
export async function loadHandlerConfig () {
  for (let i = 0; i < MessageHandlers.length; i++) {
    if (MessageHandlers[i] instanceof BaseMessageHandler) {
      await (MessageHandlers[i] as BaseMessageHandler).load()
    }
  }
}

async function main () {
  console.log(chalk.green('欢迎使用qqchat-bot: https://github.com/bincooo/qqchat-bot'))
  console.log(chalk.green('如果有用点个star吧 !!!'))

  const exist = existsConfig()
  const presetPath = process.cwd() + '/conf/preset.json'
  if (existsConfig(presetPath)) {
    // Object.assign(preset, await loadConfig(presetPath))
    await loadPresets(presetPath)
  }
  if (!exist) {
    await run()
      .then(async (conf) => {
        // merge...
        for (const key in conf) {
          if (typeof conf[key] === 'object') {
            Object.assign(config[key], conf[key])
          } else {
            config[key] = conf[key]
          }
        }
        await writeConfig(config)
      })
      .then(async () => await loadHandlerConfig())
      .then(async () => {
        await initChat()
      })
      .catch(err => { throw err })
  } else {
    Object.assign(config, await loadConfig())
    await loadHandlerConfig()
    await initChat()
  }
}

async function initChat() {
  switch(config.type) {
    case "oicq":
    case "mirai":
      await getClient().initHandlers(MessageHandlers)
    break
    default:
      throw new Error('please select a valid `qq` chat type !')
  }
}

main().catch(logger.error)
process.on('unhandledRejection', (reason, promise) => {
  // await promise
  logger.error('unhandledRejection <<<<', reason)
  promise?.catch(err => {
    logger.error('unhandledRejection >>>>', err)
  })
})
