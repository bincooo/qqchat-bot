import type { DiscussMessageEvent, GroupMessageEvent, PrivateMessageEvent } from 'oicq'
import type { GuildMessage } from 'oicq-guild/lib/message'
import { Sender } from './model/sender'

export interface envConfig {
  adminQQ?: string
  qq: string
  token: string
}

export type MessageEvent = PrivateMessageEvent | GroupMessageEvent | DiscussMessageEvent | GuildMessage

/**
 * 返回值取决于是否继续下一个拦截， true：继续，false： 中断
 */
export type MessageHandler = (sender: Sender) => boolean | Promise<boolean>

export abstract class BaseMessageHandler {
  /**
   * 加载配置的钩子
   * @param config
   */
  load (): void | Promise<void> {}

  /**
   * 重启钩子
   */
  reboot (): void | Promise<void> {}

  handle: MessageHandler
}



export type MessageFilter = (content: string, sender?: Sender) => (boolean | string)[] | Promise<(boolean | string)[]>

export abstract class BaseMessageFilter {
  /**
   * type = 0 :消息发送给chatgpt之前拦截
   * type = 1 :消息发送给 qqchat之前拦截
   */
  type?: number

  handle: MessageFilter
}