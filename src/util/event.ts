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

export function cgptEmitResetSession(...args: any) {
  globalEventEmit('cgpt:resetSession', ...args)
}

export function cgptOnResetSession(cb: (...args: any) => void) {
  globalEventRegist('cgpt:resetSession', cb)
}


export function cgptEmitChangeAccount(...args: any) {
  globalEventEmit('cgpt:resetSession', ...args)
}

export function cgptOnChangeAccount(cb: (...args: any) => void) {
  globalEventRegist('cgpt:resetSession', cb)
}