import { Sender } from './model/sender'
import { config } from 'src/config'
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


export abstract class BaseAiHandler<T> extends BaseMessageHandler {
  protected _api?: T

  override async reboot() {
    await this.load()
  }

  override handle = (sender: Sender) => {
    (config as any).chatApi = this.getApi()
    return this.enquire(sender)
  }

  enquire: MessageHandler

  build = (sender: Sender, message: MsgCaller, reply: {
    do: (
      str: string,
      onProgress?: (partialResponse: ChatMessage) => void,
      timeoutMs?: number
    ) => Promise<ChatMessage>
    on: (r: ChatMessage) => Promise<void>
  }): ((e?: Error) => Promise<void>) => {
    return async (err?: Error) => {
      if (err) {
        this.messageErrorHandler(sender, err)
        return
      }
      try {
        let result
        if (typeof message === 'string') {
          result = await reply.do(message, reply.on)
        } else {
          result = await message.call(undefined, reply.do, reply.on)
        }
      } catch (error) {
        this.messageErrorHandler(sender, error)
      }
    }

  }

  protected abstract messageErrorHandler(sender: Sender, err: Error): void

  protected setApi(api: T) {
    this._api = api
  }

  protected getApi(): T {
    return this._api as T
  }
}

export type ChatMessage = Record<string, any> & {
  text: string
  conversationId: string
}

/**
 * 队列执行类型
 */
export type MsgCaller =
  | string
  | ((reply: (s: string, on: (partialResponse: ChatMessage) => void ) => Promise<ChatMessage>, onProgress: (partialResponse: ChatMessage) => void) => Promise<string>)


// return [ boolean, (string | MsgCaller)]
// boolean: 是否继续拦截 true 是 false 否
export type MessageFilter = (content: string, sender?: Sender, done?: boolean) => (boolean | string | MsgCaller)[] | Promise<(boolean | string | MsgCaller)[]>

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
  async initHandlers(initMessageHandler?: (MessageHandler | BaseMessageHandler)[]) {}

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
  async reply(e: any, chain: TalkChain[], quote: boolean = false): Promise<[boolean, any]> {
    return [false, null]
  }

  /**
   * 撤回消息
   */
  async recall(target: any): Promise<boolean> {
    return false
  }

}



