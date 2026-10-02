import express from 'express'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Bonjour } from 'bonjour-service'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { app } from 'electron'
import type { PrinterStore } from './store.js'
import { NovaClient } from './nova-client.js'
import { handleMjpegStream } from './rtsp-bridge.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const client = new NovaClient()
const bonjour = new Bonjour()

let server: ReturnType<typeof createServer> | undefined
let bonjourService: ReturnType<typeof bonjour.publish> | undefined

export function startHttpServer(store: PrinterStore) {
  if (server) return

  const expressApp = express()
  server = createServer(expressApp)
  const wss = new WebSocketServer({ server })

  expressApp.use(express.json())

  // Serve frontend files (dist)
  const distPath = join(app.getAppPath(), 'dist')
  expressApp.use(express.static(distPath))

  // Basic API endpoints for HTTP fallback if needed
  expressApp.get('/api/printers', async (req, res) => {
    res.json(await store.list())
  })
  
  expressApp.get('/camera/:id', handleMjpegStream)
  
  // WebSocket API for PWA
  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const req = JSON.parse(message.toString())
        const respond = (data: unknown) => ws.send(JSON.stringify({ id: req.id, data }))
        const error = (msg: string) => ws.send(JSON.stringify({ id: req.id, error: msg }))
        
        switch (req.action) {
          case 'printers:list':
            respond(await store.list())
            break
          case 'printers:save':
            respond(await store.save(req.payload))
            break
          case 'printers:remove':
            await store.remove(req.payload)
            respond({ ok: true })
            break
          case 'printers:refresh':
            respond(await client.snapshot(await store.get(req.payload)))
            break
          case 'printers:refresh-all':
            respond(await Promise.all((await store.list()).filter(p => p.enabled).map(p => client.snapshot(p))))
            break
          case 'files:delete':
            await client.command(await store.get(req.payload.id), `/file/delete/${encodeURIComponent(req.payload.fileName)}`)
            respond({ ok: true, message: 'Dosya silindi.' })
            break
          case 'files:print':
            await client.command(await store.get(req.payload.id), `/file/print/${encodeURIComponent(req.payload.fileName)}`)
            respond({ ok: true, message: 'Yazdırma işi başlatıldı.' })
            break
          case 'jobs:control':
            await client.command(await store.get(req.payload.id), `/job/${req.payload.action}/${encodeURIComponent(req.payload.jobId)}`)
            respond({ ok: true, message: 'Yazdırma durumu değiştirildi.' })
            break
          default:
            error('Bilinmeyen eylem')
        }
      } catch (e) {
        console.error('WS Error:', e)
      }
    })
  })

  // Start listening on port 7373
  server.listen(7373, '0.0.0.0', () => {
    console.log('PWA HTTP Server running on port 7373')
    bonjourService = bonjour.publish({ name: 'Nova Fleet', type: 'http', port: 7373, host: 'nova-fleet.local' })
  })
}

export function stopHttpServer() {
  if (bonjourService) {
    bonjourService.stop()
    bonjourService = undefined
  }
  if (server) {
    server.close()
    server = undefined
  }
}
