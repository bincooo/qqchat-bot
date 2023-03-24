import { QueueReply } from 'cgpt'
import { BaseMessageFilter, MessageFilter } from 'src/types'
import { config, preset } from 'src/config'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'
import { cgptOnResetSession } from 'src/util/event'


function dat() {
  return new Date()
    .getTime()
}

function datFmt() {
  const ts = new Date()
    .getTime()
  const date = new Date(ts + 1000 * 60 * 60 * 7)
  const y = date.getFullYear()
  const m = date.getMonth()+1
  const d = date.getDate()
  const h = date.getHours()+1
  const mm = date.getMinutes()
  const s = date.getSeconds()
  const fmt = (n: number) => {
    return (n < 10 ? '0' + n : n)
  }
  return `${y}-${fmt(m)}-${fmt(d)} ${fmt(h)}:${fmt(mm)}:${fmt(s)}`
}

function replyMessage(player: any, content: string, sender?: Sender) {
  return (player.prefix.includes('[!!content!!]')
    ?
    player.prefix.replace('[!!content!!]', content)
    :
    player.prefix.concat(content))

  .replace('[!!date!!]', datFmt())
  .replace('[!!name!!]', sender?.nickname)
}

const MAX_COUNT = 20
export class PlayerFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
    cgptOnResetSession((...args: any) => {
      const uid: number | string = args[0]
      if (uid) {
        const state: any = stateManager.getState(uid)
        state.isReset = true
      } else {
        const ids: Array<number | string> = stateManager.getIds()
        for(let index = 0; index < ids.length; index ++) {
          const state: any = stateManager.getState(ids[index])
          state.isReset = true
        }
      }
    })
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    const result0 = this.presetEnabled(content, sender, state)
    if (result0) return result0

    if (!!state.preset?.key) {
      state.preset.count++

      const result1 = this.handlePresetMaintenance(content, sender, state)
      if (result1) return result1

      state.isReset = false
      state.preset.maintenanceCount = 0
      if (state.preset.count > MAX_COUNT) {
        state.preset.count = 0
      }

      const player =  preset.player?.find(item => item.key === state.preset.key)
      if (!!player) {
        preset.maintenance = false
        
        const result: QueueReply = async (reply) => {
          const curr = dat()
          let timer: NodeJS.Timer = null
          if (!player.nottips) {
            timer = setInterval(() => {
              if (curr + 10000 < dat()) {
                sender?.reply("[loading preset: \"" + state.preset.key + "\"]\n——————\n\n喝杯咖啡,让我回忆一下...")
                stateManager.sendLoading(sender, { init: true, isEnd: false })
                clearInterval(timer)
                timer = null
              }
            }, 300)
          }

          let resultMessage = content
          let { training, enableCached } = player.training
          if (!enableCached || state.player.cacheList?.length <= 0) {
            await reply('Forget the previous conversation. The following conversation should not be affected by the previous one, including the role-play and prompt. Please restore to the default status.       Now, All the following conversations will be answered in Chinese.')
          }
          if (typeof training === 'string') {
            training = [ player.training ]
          }

          for(let index = 0; index < training?.length; index++) {
            const message = training[index]
            if (index === training.length - 1 && message.includes('[!!content!!]')) {
              resultMessage = message.replace('[!!content!!]', content)
              break
            }
            const res = await reply(message)
          }

          if (state.preset.key === '默认') {
            state.preset.key = ''
          }

          if (timer) {
            clearInterval(timer)
            timer = null
          }

          return replyMessage(player, resultMessage, sender)
        }
        return [ false, result ]
      }
    }

    return [ true, content ]
  }

  presetEnabled(content: string, sender?: Sender, state: any): (boolean | QueueReply)[] {
    if (content?.trim().startsWith("开启 ")) {
      const message = content.trim()
        .split(" ")[1]
      if (message) {
        const obj = preset.player?.find(item => item.key === message.trim())
        if (obj) {
          sender?.reply("已开启【" + obj.key + "】，那我们开始聊天吧 ~")
          state.preset = {
            key: obj.key,
            count: MAX_COUNT,
            cacheList: [],
            maintenanceCount: 0
          }
          return [ false, "" ]
        }
      }
    }
    return null
  }

  handlePresetMaintenance(content: string, sender?: Sender, state: any): (boolean | QueueReply)[] {
    if(state.preset.count <= MAX_COUNT && !state.isReset) {
      if (!state.preset.maintenance) {
        const player = preset.player.filter(item => item.key === state.preset.key)[0]
        const cacheMessage = (message: string) => {
          if (player.enableCached) {
            const cacheList = state.preset.cacheList
            cacheList.push(message)
            if (cacheList.length > 6) {
              state.preset.cacheList = cacheList.splice(0, 6)
            }
          }
        }

        if (player?.prefix) {
          const resultMessage = replyMessage(player, content, sender)
          cacheMessage(resultMessage)
          return [ false, resultMessage ]
        }
        cacheMessage(content)
        return [ true, content ]
      }

      state.preset.maintenance = false
      const player = preset.player.filter(item => item.key === state.preset.key)[0]
      if (!!player) {
        // 统计越狱次数
        state.preset.maintenanceCount ++
        // end //

        if (player.maintenance.warning) {
          sender.reply(player.maintenance.warning.replace('[!!condition!!]', state.preset.maintenanceCondition))
        }
        // 越狱触发2次
        if (state.preset.maintenanceCount >= 2) {
          state.count = MAX_COUNT // 即将发送一次预设
        }
        // end //

        const result: QueueReply = async (reply) => {
          let resultMessage = player.maintenance.training
          const cacheList = state.preset.cacheList
          
          if (player.enableCached && resultMessage.includes('[!!cacheMsgs!!]')) {
            resultMessage = resultMessage.replace('[!!cacheMsgs!!]', cacheList?.join('\n'))
          }

          const res = await reply(resultMessage)
          return replyMessage(player, content, sender)
        }
        return [ false, result ]
      }
    }
    return null
  }

}

