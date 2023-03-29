import { config } from 'src/config'
import type { TalkWrapper } from 'src/types'
import oicq from './oicq'
import mirai from './mirai'

export default function getClient(): TalkWrapper {
  switch(config.type) {
    case "mirai":
      return mirai
    default:
      return oicq
  }
}