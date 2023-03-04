import { BaseMessageHandler } from 'src/types'
import logger from './util/log'
import { initOicq } from './core/oicq'
import MessageHandlers from './handler'
import { existsConfig, loadConfig, writeConfig } from './util/config'
import { config, preset } from './config'
import { run } from './auto'
import chalk from 'chalk'

/**
 * 触发handler load钩子
 */
async function loadHandlerConfig () {
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
  const presetPath = process.cwd() + '/preset.json'
  if (existsConfig(presetPath)) {
    Object.assign(preset, await loadConfig(presetPath))
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
        await initOicq(MessageHandlers)
      })
      .catch(err => { throw err })
  } else {
    Object.assign(config, await loadConfig())
    await loadHandlerConfig()
    await initOicq(MessageHandlers)
  }
}

main().catch(logger.error)

process.on('unhandledRejection', (reason, promise) => {
  console.log(reason)
  logger.error(reason)
})
