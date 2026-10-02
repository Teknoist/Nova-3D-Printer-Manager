import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'
import type { PrinterConfig } from '../src/shared/types.js'

interface SdcpConnection {
  socket: WebSocket
  printerId: string
  pingTimer?: ReturnType<typeof setInterval>
  reconnectTimer?: ReturnType<typeof setTimeout>
  lastPong: number
  statusCache: Record<string, unknown>
}

const connections = new Map<string, SdcpConnection>()

export function getSdcpStatus(printerId: string): Record<string, unknown> | undefined {
  return connections.get(printerId)?.statusCache
}

export function startSdcpConnection(printer: PrinterConfig, deviceId: string, mainboardId: string, host: string, port: number) {
  if (connections.has(printer.id)) return

  const url = `ws://${host}:${port}/websocket`
  const socket = new WebSocket(url)
  
  const connection: SdcpConnection = {
    socket,
    printerId: printer.id,
    lastPong: Date.now(),
    statusCache: {}
  }
  connections.set(printer.id, connection)

  const cleanup = () => {
    if (connection.pingTimer) clearInterval(connection.pingTimer)
    if (connection.reconnectTimer) clearTimeout(connection.reconnectTimer)
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.terminate()
    }
    connections.delete(printer.id)
  }

  socket.on('open', () => {
    connection.lastPong = Date.now()
    // Subscribe to status
    socket.send(JSON.stringify({
      Id: deviceId,
      Data: {
        Cmd: 0,
        Data: {},
        RequestID: randomUUID().replaceAll('-', ''),
        MainboardID: mainboardId,
        TimeStamp: Math.floor(Date.now() / 1000),
        From: 0,
      },
      Topic: `sdcp/request/${mainboardId}`,
    }))

    // Start ping interval
    connection.pingTimer = setInterval(() => {
      if (Date.now() - connection.lastPong > 35000) {
        console.warn(`SDCP WebSocket ping timeout for ${printer.name}`)
        cleanup()
        startSdcpConnection(printer, deviceId, mainboardId, host, port)
        return
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping()
      }
    }, 15000)
  })

  socket.on('pong', () => {
    connection.lastPong = Date.now()
  })

  socket.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString())
      if (parsed?.Data?.Cmd === 384 || parsed?.Status) {
        const statusData = parsed.Data?.Data?.Status ?? parsed.Status ?? parsed.Data?.Status
        if (statusData && typeof statusData === 'object') {
          connection.statusCache = { ...connection.statusCache, ...statusData }
        }
      }
    } catch (e) {
      // ignore JSON parse error
    }
  })

  socket.on('error', () => {
    cleanup()
    connection.reconnectTimer = setTimeout(() => startSdcpConnection(printer, deviceId, mainboardId, host, port), 5000)
  })

  socket.on('close', () => {
    cleanup()
    connection.reconnectTimer = setTimeout(() => startSdcpConnection(printer, deviceId, mainboardId, host, port), 5000)
  })
}

export function stopSdcpConnection(printerId: string) {
  const connection = connections.get(printerId)
  if (connection) {
    if (connection.pingTimer) clearInterval(connection.pingTimer)
    if (connection.reconnectTimer) clearTimeout(connection.reconnectTimer)
    connection.socket.terminate()
    connections.delete(printerId)
  }
}

export function sendSdcpCommand(printerId: string, deviceId: string, mainboardId: string, command: number, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const connection = connections.get(printerId)
  if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
    return Promise.reject(new Error('Yazıcı ile WebSocket bağlantısı yok.'))
  }

  return new Promise((resolve, reject) => {
    const requestId = randomUUID().replaceAll('-', '')
    
    const onMessage = (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString())
        const envelope = parsed?.Data
        if (envelope && envelope.RequestID === requestId) {
          connection.socket.off('message', onMessage)
          const ack = envelope.Data?.Ack ?? envelope.Data?.ack
          if (ack !== undefined && ack !== 0) {
            reject(new Error(`SDCP komut reddedildi (Ack=${ack})`))
          } else {
            resolve(envelope.Data ?? envelope)
          }
        }
      } catch (e) {}
    }
    
    connection.socket.on('message', onMessage)

    connection.socket.send(JSON.stringify({
      Id: deviceId,
      Data: {
        Cmd: command,
        Data: payload,
        RequestID: requestId,
        MainboardID: mainboardId,
        TimeStamp: Math.floor(Date.now() / 1000),
        From: 0,
      },
      Topic: `sdcp/request/${mainboardId}`,
    }))
    
    setTimeout(() => {
      connection.socket.off('message', onMessage)
      reject(new Error('Komut zaman aşımına uğradı'))
    }, 8000) // Increased timeout to 8s as per instructions
  })
}
