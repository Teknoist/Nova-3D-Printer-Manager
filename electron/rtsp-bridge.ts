import { spawn, type ChildProcess } from 'node:child_process'
import type { Request, Response } from 'express'
import { enableSdcpCamera } from './sdcp-ws.js'
import ffmpegPath from 'ffmpeg-static'

const streams = new Map<string, {
  process: ChildProcess,
  clients: Set<Response>,
  lastActive: number
}>()

import type { PrinterStore } from './store.js'

export async function handleMjpegStream(req: Request, res: Response, store: PrinterStore) {
  const printerId = req.params.id as string
  if (!printerId) {
    res.status(400).send('ID required')
    return
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
    'Pragma': 'no-cache',
    'Connection': 'close',
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
  })

  let stream = streams.get(printerId)

  if (!stream) {
    let rtspUrl = ''
    try {
      const printer = await store.get(printerId)
      if (printer.protocol === 'sdcp3') {
        rtspUrl = await enableSdcpCamera(printerId)
      } else {
        rtspUrl = `rtsp://${printer.host}:554/stream`
      }
    } catch (err) {
      console.error('Camera init error:', err)
      res.end()
      return
    }
    // We use ffmpegMpjpeg instead of raw ffmpeg. Replace app.asar with app.asar.unpacked since it's an executable
    let ffmpegCmd = typeof ffmpegPath === 'string' ? ffmpegPath : (ffmpegPath as any)?.path ?? 'ffmpeg';
    ffmpegCmd = ffmpegCmd.replace('app.asar', 'app.asar.unpacked');

    const ffmpegMpjpeg = spawn(ffmpegCmd, [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mpjpeg',
      '-r', '15',
      '-q:v', '5',
      '-an',
      '-'
    ])
    
    stream = {
      process: ffmpegMpjpeg,
      clients: new Set(),
      lastActive: Date.now()
    }
    streams.set(printerId, stream)

    ffmpegMpjpeg.stdout.on('data', (data: Buffer) => {
      stream!.clients.forEach(client => {
        client.write(data)
      })
    })

    ffmpegMpjpeg.stderr.on('data', (data) => {
      // console.error(`ffmpeg stderr: ${data}`)
    })

    ffmpegMpjpeg.on('close', () => {
      stream!.clients.forEach(client => client.end())
      streams.delete(printerId)
    })
  }

  stream.clients.add(res)
  stream.lastActive = Date.now()

  req.on('close', () => {
    stream!.clients.delete(res)
    if (stream!.clients.size === 0) {
      setTimeout(() => {
        if (stream!.clients.size === 0) {
          stream!.process.kill()
          streams.delete(printerId)
        }
      }, 5000) // Keep alive for 5 seconds in case of quick refresh
    }
  })
}
