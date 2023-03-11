import { config } from 'src/config'
import { getClient as getOicq } from './oicq'
import { getClient as getMirai } from './mirai'

export default function getClient() {
  switch(config.type) {
    case "mirai":
      return getMirai()
    default:
      return getOicq()
  }
}