import { Capacitor } from '@capacitor/core'
import type { ActionResult, NovaFleetApi, PrinterConfig, PrinterSnapshot, SavePrinterInput } from '../shared/types'
import { androidApi } from './android-api'

const configs: PrinterConfig[] = [
  { id: 'preview-1', name: 'Reçine Lab 01', host: '192.168.1.84', port: 8081, model: 'Nova3D Elfin', location: 'Prototip Atölyesi', pollInterval: 10, enabled: true },
  { id: 'preview-2', name: 'Reçine Lab 02', host: '192.168.1.91', port: 8081, model: 'Nova3D Bene4', location: 'Prototip Atölyesi', pollInterval: 12, enabled: true },
  { id: 'preview-3', name: 'Tasarım Stüdyosu', host: '192.168.1.103', port: 8081, model: 'Nova3D Whale3', location: '2. Kat', pollInterval: 15, enabled: true },
]

const files = [
  { name: 'gearbox_v12', extension: 'cws', size: 48_890_112, modifiedDate: '2026-06-30T09:42:00', fullName: 'gearbox_v12.cws' },
  { name: 'enclosure-final', extension: 'cws', size: 72_241_152, modifiedDate: '2026-06-29T16:18:00', fullName: 'enclosure-final.cws' },
  { name: 'calibration-matrix', extension: 'cws', size: 12_713_984, modifiedDate: '2026-06-26T11:05:00', fullName: 'calibration-matrix.cws' },
]

function snapshots(): PrinterSnapshot[] {
  const progress = 57.8
  return [
    { config: configs[0], state: 'printing', latency: 24, firmware: '3.5.0', files, usedBytes: files.reduce((a, b) => a + b.size, 0), lastSeen: new Date().toISOString(), activeJob: { id: 'job-1', jobName: 'gearbox_v12.cws', printInProgress: true, printPaused: false, status: 'printing', thickness: .05, totalSlices: 1842, currentSlice: 1065, currentSliceTime: 14000, averageSliceTime: 14200, elapsedTime: 3_112_000, progress } },
    { config: configs[1], state: 'online', latency: 18, firmware: '3.5.0', files: files.slice(1), usedBytes: 84_955_136, lastSeen: new Date().toISOString() },
    { config: configs[2], state: 'offline', files: [], usedBytes: 0, error: 'Yazıcı ağda yanıt vermiyor.' },
  ]
}

const ok = (message: string): Promise<ActionResult> => Promise.resolve({ ok: true, message })

const previewApi: NovaFleetApi = {
  listPrinters: async () => configs,
  savePrinter: async (input: SavePrinterInput) => {
    const value = { ...input, id: input.id ?? `preview-${Date.now()}` } as PrinterConfig
    const index = configs.findIndex((item) => item.id === value.id)
    if (index >= 0) configs[index] = value; else configs.push(value)
    return value
  },
  removePrinter: async (id) => { const index = configs.findIndex((item) => item.id === id); if (index >= 0) configs.splice(index, 1); return { ok: true } },
  refreshPrinter: async (id) => snapshots().find((item) => item.config.id === id) ?? { config: configs.find((item) => item.id === id)!, state: 'online', files: [], usedBytes: 0 },
  refreshAll: async () => snapshots(),
  chooseAndUpload: () => ok('Önizleme modunda örnek yükleme tamamlandı.'),
  deleteFile: () => ok('Dosya silindi.'),
  printFile: () => ok('Yazdırma işi başlatıldı.'),
  controlJob: () => ok('Yazdırma durumu değiştirildi.'),
  onUploadProgress: () => () => undefined,
  onPrinterIpUpdated: () => () => undefined,
  getSettings: async () => {
    const stored = localStorage.getItem('nova_settings')
    return stored ? JSON.parse(stored) : { autoSdcpDiscovery: false }
  },
  saveSettings: async (settings) => {
    const stored = localStorage.getItem('nova_settings')
    const current = stored ? JSON.parse(stored) : {}
    const merged = { ...current, ...settings }
    localStorage.setItem('nova_settings', JSON.stringify(merged))
    return merged
  },
  getLocalIps: async () => ['127.0.0.1']
}

function createPwaApi(): NovaFleetApi {
  let ws: WebSocket | undefined
  const cbs = new Map<number, { resolve: (data: any) => void; reject: (err: any) => void }>()
  let msgId = 0

  function getWs(): Promise<WebSocket> {
    if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(ws)
    return new Promise((resolve, reject) => {
      const url = `ws://${window.location.host}`
      const socket = new WebSocket(url)
      socket.onmessage = (e) => {
        try {
          const res = JSON.parse(e.data)
          const cb = cbs.get(res.id)
          if (cb) {
            cbs.delete(res.id)
            if (res.error) cb.reject(new Error(res.error))
            else cb.resolve(res.data)
          }
        } catch {}
      }
      socket.onopen = () => { ws = socket; resolve(ws) }
      socket.onerror = (e) => reject(new Error('WebSocket connection failed'))
    })
  }

  async function request<T>(action: string, payload?: any): Promise<T> {
    const socket = await getWs()
    const id = ++msgId
    return new Promise<T>((resolve, reject) => {
      cbs.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, action, payload }))
      setTimeout(() => {
        if (cbs.has(id)) { cbs.delete(id); reject(new Error('PWA API timeout')) }
      }, 10000)
    })
  }

  return {
    listPrinters: () => request('printers:list'),
    savePrinter: (input) => request('printers:save', input),
    removePrinter: (id) => request('printers:remove', id),
    refreshPrinter: (id) => request('printers:refresh', id),
    refreshAll: () => request('printers:refresh-all'),
    chooseAndUpload: () => ok('PWA üzerinden dosya yükleme henüz desteklenmiyor.'),
    deleteFile: (id, fileName) => request('files:delete', { id, fileName }),
    printFile: (id, fileName) => request('files:print', { id, fileName }),
    controlJob: (id, jobId, action) => request('jobs:control', { id, jobId, action }),
    onUploadProgress: () => () => undefined,
    onPrinterIpUpdated: () => () => undefined,
    getSettings: () => request('settings:get'),
    saveSettings: (settings) => request('settings:save', settings),
    getLocalIps: () => request('system:getLocalIps'),
  }
}

export const api: NovaFleetApi = window.novaFleet ?? (Capacitor.getPlatform() === 'android' ? androidApi : (window.location.port === '7373' ? createPwaApi() : previewApi))
