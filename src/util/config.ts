import logger from 'src/util/log'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { preset as globalPreset } from 'src/config'
import chalk from 'chalk'

const configFile = process.cwd() + '/conf/config.json'

export async function loadConfig (config?: string) {
  const str = (await readFile(config??configFile)).toString()
  return JSON.parse(str)
}

export function existsConfig (config?: string) {
  return existsSync(config??configFile)
}

// export async function validConfigFile () {
//   if (!existsConfig) {
//     console.error(`请正确配置config.json文件(已自动生成 ${configFile} ，填写对应值即可)`)
//     await writeConfig(config)
//     process.exit()
//   }
// }

export async function writeConfig (config: object) {
  const content = JSON.stringify(config, null, 2)
  await writeFile(configFile, content)
  logger.info(chalk.green(`config.json 创建成功！${configFile}`))
}

export async function loadPresets(config?: string) {
  if (!config) config = process.cwd() + '/conf/preset.json'
  const basePath = process.cwd() + '/conf/prompt/',
    prefix = 'path:'
  const preset = await NonErr(async () => JSON.parse((await readFile(config)).toString()), {})
  if (preset.novelAiHelper?.startsWith(prefix)) {
    const str = (await readFile(basePath + preset.novelAiHelper.substr(prefix.length))).toString()
    preset.novelAiHelper = str
  }
  if (preset.default?.startsWith(prefix)) {
    const str = (await readFile(basePath + preset.default.substr(prefix.length))).toString()
    preset.default = str
  }
  for(let index = 0, length = preset.player?.length; index < length; index ++) {
    const player = preset.player[index]
    if (player.training) {
      if (typeof player.training === 'string') {
        if (player.training?.startsWith(prefix)) {
          const str = (await readFile(basePath + player.training.substr(prefix.length))).toString()
          player.training = str
        }
      } else {
        for(let idx = 0, len = player.training.length; idx < len; idx ++) {
          const training = player.training[idx]
          if (training?.startsWith(prefix)) {
            const str = (await readFile(basePath + training.substr(prefix.length))).toString()
            player.training[idx] = str
          }
        }
      }
    }
    if (player.maintenance?.training?.startsWith(prefix)) {
      const str = (await readFile(basePath + player.maintenance.training.substr(prefix.length))).toString()
      player.maintenance.training = str
    }
    if (player.maintenance?.guard.startsWith(prefix)) {
      const str = (await readFile(basePath + player.maintenance.guard.substr(prefix.length))).toString()
      player.maintenance.guard = str
    }
  }
  Object.assign(globalPreset, preset)
}

/**
 * ignore error stask, and return default object.
 * @cb callback function
 * @def default object
 */
async function NonErr(cb: () => any, def?: any): any {
  try {
    return await cb.call(undefined)
  } catch(err) {}
  return def
}
