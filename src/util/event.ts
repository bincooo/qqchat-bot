import { EventEmitter } from 'events'

class GlobalEmiter extends EventEmitter {

}

const emit = new GlobalEmiter()

export function globalEventRegist(event: string, cb: (...args: any) => void) {
  emit.on(event, cb)
}

export function globalEventEmit(event: string, ...args: any) {
  emit.emit(event, ...args)
}

export function globalEventRemove(event: string, cb: (...args: any) => void) {
  emit.removeListener(event, cb)
}

export function aiEmitResetSession(...args: any) {
  globalEventEmit('ai:resetSession', ...args)
}

export function aiOnResetSession(cb: (...args: any) => void) {
  globalEventRegist('ai:resetSession', cb)
}
