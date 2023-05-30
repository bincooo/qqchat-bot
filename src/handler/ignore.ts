import { MessageHandler } from 'src/types'
import { loadConfig } from 'src/util/config'


let filter = []
const configFile = process.cwd() + '/conf/ignore.json'
loadConfig(configFile)
  .then(ig => {
    filter = ig ?? []
  })

const hint = [
  "别问了, 拜托你省点心吧 ~",
  "问!问!问!一天到晚没事做?",
  "这是无法触碰的滑梯!",
  "年轻人, 我劝你耗子尾汁 ~",
  "以上发言与本Ai无关, 从不参与!划清界限 !!",
  "做个人, 别问了好吗"
]

export const ignoreHandler: MessageHandler = function (sender) {
  const content = sender.textMessage?.trim() ?? ""
  if (sender.isAdmin) return true
  for (let index = 0, len = filter.length; index < len; index ++) {
    if (content && content.includes(filter[index])) {
      const idx = parseInt((Math.random() * hint.length) + "", 10)
      sender.reply(hint[idx], true)
      return false
    }
  }
  return true
}
