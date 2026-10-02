export type ToastMessage = { id: number; text: string; kind: 'success' | 'error' | 'info'; printerId?: string }

type Listener = (toasts: ToastMessage[], overflowCount: number) => void

class NotificationQueue {
  private queue: ToastMessage[] = []
  private active: ToastMessage[] = []
  private listeners: Set<Listener> = new Set()
  private maxActive = 3
  private timeoutMap: Map<number, number> = new Map()

  add(text: string, kind: ToastMessage['kind'] = 'success', printerId?: string) {
    const id = Date.now() + Math.random()
    const toast: ToastMessage = { id, text, kind, printerId }
    this.queue.push(toast)
    this.processQueue()
  }

  private processQueue() {
    while (this.active.length < this.maxActive && this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) {
        this.active.push(next)
        const timer = window.setTimeout(() => this.remove(next.id), 4000)
        this.timeoutMap.set(next.id, timer)
      }
    }
    this.notify()
  }

  remove(id: number) {
    this.active = this.active.filter(t => t.id !== id)
    if (this.timeoutMap.has(id)) {
      window.clearTimeout(this.timeoutMap.get(id))
      this.timeoutMap.delete(id)
    }
    this.processQueue()
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    listener(this.active, this.queue.length)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener([...this.active], this.queue.length)
    }
  }
}

export const toastQueue = new NotificationQueue()
