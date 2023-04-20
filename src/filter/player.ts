import { BaseMessageFilter, MessageFilter, MsgCaller } from 'src/types'
import { config, preset } from 'src/config'
import { Sender } from 'src/model/sender'
import stateManager from 'src/util/state'
import { aiOnResetSession } from 'src/util/event'
import { checkActingBehavior } from 'src/util/message'
import guardAi from 'src/util/guard'
import PlayerCommand from 'src/command/commands/player'
import { NowAI } from 'src/util/config'


function dat() {
  return new Date()
    .getTime()
}

function IsEmpty(val: string): boolean {
  if (!val) return true
  const value = val?.trim()
    .replaceAll('　', '')
  if (value === '') return true
  if (value.length === 0) return true
  return false
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

function replyMessage(prefix: string = "", content: string, sender?: Sender, append: boolean = true) {
  const state: any = stateManager.getState(sender.id)
  // emoji 过滤
  const regex = /[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|[\A9|\AE]\u3030|\uA9|\uAE|\u3030/g
  let nickname = sender.nickname
    .trim()
    .replaceAll(regex, '')

  if (IsEmpty(nickname)) {
    nickname = '陆仁贾'
  }
  const online = (state?.preset?.onlineList??[]).map(it => `{name:"${it.name}",id:"${it.id}"}`).join(', ')
  return (prefix.includes('[!!content!!]')
    ?
    prefix.replaceAll('[!!content!!]', content)
    :
    append ? prefix.concat(content) : prefix)

  .replaceAll('[!!date!!]', datFmt())
  .replaceAll('[!!name!!]', nickname)
  .replaceAll('[!!online!!]', `[ ${online} ]`)
}

const MAX_COUNT = 15
export class PlayerFilter extends BaseMessageFilter {

  constructor() {
    super()
    this.type = 0
    aiOnResetSession((...args: any) => {
      const uid: number | string = args[0]
      if (uid) {
        const state: any = stateManager.getState(uid)
        state.isReset = true
        const ai = NowAI()
        const player =  preset.player?.find(item => item.key === state.preset?.key && item.type.includes(ai))
        if (player && player.cache) {
          state.preset.cacheList = []
        }
      } else {
        const ai = NowAI()
        const ids: Array<number | string> = stateManager.getIds()
        const player =  preset.player?.find(item => item.key === state.preset?.key && item.type.includes(ai))
        for(let index = 0; index < ids.length; index ++) {
          const state: any = stateManager.getState(ids[index])
          state.isReset = true
          if (player && player.cache) {
            state.preset.cacheList = []
          }
        }
      }
    })
  }

  handle = async (content: string, sender?: Sender) => {
    const state: any = stateManager.getState(sender.id)
    let hResult = this.presetEnabled(content, sender, state)
    if (hResult) return hResult

    if (!!state.preset?.key) {
      const ai = NowAI()
      const player =  preset.player?.find(item => item.key === state.preset.key && item.type.includes(ai))

      if (player.cycle ?? true) {
        state.preset.count++
      }

      if (player.online) {
        const online = state.preset.onlineList.find(it => it.name == sender.nickname)
        if (!online) {
          state.preset.onlineList.push({
            name: sender.nickname,
            id: sender.userId
          })
          state.preset.onlineList = state.preset.onlineList.splice(0, 50)
        }
      }

      hResult = this.handleReply(content, sender, state)
      if (hResult) return hResult

      hResult = this.handlePresetMaintenance(content, sender, state)
      if (hResult) return hResult

      state.isReset = false
      state.preset.maintenanceCount = 0
      if (state.preset.count > MAX_COUNT) {
        state.preset.count = 0
      }

      if (!!player) {
        preset.maintenance = false
        
        const result: MsgCaller = async (reply, onProgress) => {
          if (player.maintenance?.guard) {
            const checkResult = await guardAi.check(content, sender)
            if (!checkResult) {
              if (player.cache) {
                const cacheList = state.preset.cacheList
                state.preset.cacheList = cacheList.splice(0, cacheList.length - 1)
              }
              return null
            }
          }

          const curr = dat()
          let timer: NodeJS.Timer = null
          if (!player.nottips) {
            timer = setInterval(() => {
              if (curr + 10000 < dat()) {
                sender?.reply("[loading preset: \"" + state.preset.key + "\"]\n——————\n\neumm... 让我思考一下呢 ~")
                stateManager.sendLoading(sender, { init: true, isEnd: false })
                clearInterval(timer)
                timer = null
              }
            }, 300)
          }

          let resultMessage = content
          let { training, cache } = player
          if (!cache) {
            await reply('Forget the previous conversation. The following conversation should not be affected by the previous one, including the role-play and prompt. Please restore to the default status.       Now, All the following conversations will be answered in Chinese.')
          } else {
            await reply('hi')
          }
          if (typeof training === 'string') {
            training = [ player.training ]
          }

          for(let index = 0; index < training?.length; index++) {
            const message = training[index]
            if (index === training.length - 1 && message?.includes('[!!content!!]')) {
              resultMessage = replyMessage(message, content, sender)
              break
            }
            const res = await reply(replyMessage(message, content, sender, false))
          }

          if (state.preset.key === '默认') {
            state.preset.key = ''
          }

          if (timer) {
            clearInterval(timer)
            timer = null
          }

          if (resultMessage !== content) {
            return await reply( resultMessage, onProgress )
          }

          return await reply( replyMessage(player.prefix, resultMessage, sender), onProgress )
        }
        return [ false, result ]
      }
    }

    return [ true, content ]
  }

  presetEnabled(content: string, sender?: Sender, state: any): (boolean | MsgCaller)[] | null {
    if (content?.trim().startsWith("开启 ")) {
      const message = content.trim()
        .split(" ")[1]

      if (["R18"].includes(message) && !sender?.isAdmin) {
        sender.reply('你没有权限使用该命令~', true)
        return [ false, "" ]
      }

      if (message) {
        const ai = NowAI()
        const obj = preset.player?.find(item => item.key === message && item.type.includes(ai))
        if (obj) {
          sender?.reply("已开启【" + obj.key + "】，那我们开始聊天吧 ~")
          state.preset = {
            key: obj.key,
            count: MAX_COUNT + 1,
            onlineList: [],
            cacheList: [],
            maintenanceCount: 0
          }
          return [ false, "" ]
        } else {
          const command = new PlayerCommand()
          command.execute(sender, [ 'help' ])
          return [ false, "" ]
        }
      }
    }
    return null
  }

  /**
   * 处理预设守护功能，当触发辨识词条就会发送守护预设
   */
  handlePresetMaintenance(content: string, sender?: Sender, state: any): (boolean | MsgCaller)[]  | null {
    if(state.preset.count <= MAX_COUNT && !state.isReset) {
      state.preset.maintenance = false
      const ai = NowAI()
      const player = preset.player.filter(item => item.key === state.preset.key && item.type.includes(ai))[0]
      if (!!player) {
        
        if (player.maintenance?.warning) {
          sender.reply(player.maintenance.warning.replaceAll('[!!condition!!]', state.preset.maintenanceCondition))
        }

        // 开启周期
        if (player.cycle ?? true) {
          // 统计守护次数
          state.preset.maintenanceCount ++
          // 守护触发2次
          if (state.preset.maintenanceCount >= 2) {
            state.preset.count = MAX_COUNT + 1 // 即将发送一次默认预设
          }
        }
        // end //

        const result: QueueReply = async (reply, onProgress) => {
          if (player.maintenance?.guard) {
            const checkResult = await guardAi.check(content, sender)
            if (!checkResult) {
              if (player.cache) {
                const cacheList = state.preset.cacheList
                state.preset.cacheList = cacheList.splice(0, cacheList.length - 1)
              }
              return null
            }
          }

          const [ playerMessage, resultMessage ] = this.transformGuardContent(content, player, state, sender)
          if (!resultMessage) {
            return playerMessage
          }
          await reply(playerMessage)
          return await reply( resultMessage, onProgress )
        }
        return [ false, result ]
      }
    }
    return null
  }

  /**
   * 处理应答消息
   */
  handleReply(content: string, sender?: Sender, state: any): (boolean | MsgCaller)[] | null {
    if(state.preset.count <= MAX_COUNT && !state.isReset) {
      if (!state.preset.maintenance) {
        const ai = NowAI()
        const player = preset.player.filter(item => item.key === state.preset.key && item.type.includes(ai))[0]
        const cacheMessage = (message: string) => {
          if (player.cache) {
            const cacheList = state.preset.cacheList
            cacheList.push(message)
            const max_cathe = 3 // 缓存最大对话次数
            if (cacheList.length > max_cathe * 2) {
              state.preset.cacheList = cacheList.splice(cacheList.length - (max_cathe * 2), max_cathe * 2)
            }
          }
        }

        const newReply = (val: string) => {
          return async (reply, onProgress) => {
            if (player?.maintenance?.guard) {
              const checkResult = await guardAi.check(content, sender)
              if (!checkResult) {
                if (player.cache) {
                  const cacheList = state.preset.cacheList
                  state.preset.cacheList = cacheList.splice(0, cacheList.length - 1)
                }
                return null
              }
            }
            let result = await reply(val, onProgress)
            const condition = checkActingBehavior(state, result.text ?? '')
            if (condition) {
              console.log('player.ts::handleReply[280]: condition = ', condition)
              if (player.cache) {
                const cacheList = state.preset.cacheList
                state.preset.cacheList = cacheList.splice(0, cacheList.length - 1)
              }
              const [ playerMessage, resultMessage ] = this.transformGuardContent(val, player, state, sender)
              if (!resultMessage) {
                result = await reply(playerMessage, onProgress)
              } else {
                await reply(playerMessage)
                result = await reply(val, onProgress)
              }
            }
            return result
          }
        }

        if (player?.prefix) {
          const resultMessage = replyMessage(player.prefix, content, sender)
          cacheMessage(resultMessage)
          return [ false, newReply(resultMessage) ]
        }
        cacheMessage(content)
        return [ false, newReply(content) ]
      }
    }
    return null
  }

  transformGuardContent(content: stirng, player: any, state: any, sender: Sender): [ string, string ] {
    let resultMessage = player.maintenance?.training
    const cacheList = state.preset.cacheList
    if (player.cache && resultMessage?.includes('[!!cache!!]')) {
      resultMessage = resultMessage.replaceAll('[!!cache!!]', cacheList?.join('\n'))
    }
    if (resultMessage?.includes('[!!content!!]')) {
      return [ replyMessage("", resultMessage.replaceAll('[!!content!!]', content), sender), null ]
    }
    return [ resultMessage, replyMessage(player.prefix, content, sender) ]
  }
}

