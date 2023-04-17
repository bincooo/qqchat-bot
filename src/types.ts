import { QueueReply } from 'cgpt'
import { Sender } from './model/sender'
//https://www.typescriptlang.org/play?#code


export interface envConfig {
  adminQQ?: string
  qq: string
  token: string
}


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

export type ChatMessage = Record<string, any> & {
  text: string
  conversationId: string
}

/**
 * 队列执行类型
 */
export type QueueReply =
  | string
  | ((reply: (s: string, on: (partialResponse: ChatMessage) => void ) => Promise<ChatMessage>, onProgress: (partialResponse: ChatMessage) => void) => Promise<string>)


// return [ boolean, (string | QueueReply)]
// boolean: 是否继续拦截 true 是 false 否
export type MessageFilter = (content: string, sender?: Sender, done?: boolean) => (boolean | string | QueueReply)[] | Promise<(boolean | string | QueueReply)[]>

export abstract class BaseMessageFilter {
  /**
   * type = 0 :消息发送给chatgpt之前拦截
   * type = 1 :消息发送给 qqchat之前拦截
   */
  type?: number

  handle: MessageFilter
}


export type TalkChain = { type: string } & Record<string, (number | string)>

export abstract class TalkWrapper {
  abstract get target(): any
  /**
   * 初始化处理器
   */
  abstract async initHandlers(initMessageHandler?: (MessageHandler | BaseMessageHandler)[]): void

  /**
   * 基础信息
   */
  abstract information(e: any): Record<string, (number | string)> & {
    textMessage: string
    nickname: string
    isAdmin: boolean
    group?: string
  }

  /**
   * 会话Id
   */
  abstract sessionId(e: any): number

  /**
   * 回复消息
   */
  abstract async reply(e: any, chain: TalkChain[], quote?: boolean = false): [boolean, any]

  /**
   * 撤回消息
   */
  abstract async recall(target: any): boolean

}



