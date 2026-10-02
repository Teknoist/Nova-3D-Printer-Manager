import { spawn, type ChildProcess } from 'node:child_process'
import type { Request, Response } from 'express'

const streams = new Map<string, {
  process: ChildProcess,
  clients: Set<Response>,
  lastActive: number
}>()

export function handleMjpegStream(req: Request, res: Response) {
  const printerIp = req.params.ip as string
  if (!printerIp) {
    res.status(400).send('IP required')
    return
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, pre-check=0, post-check=0, max-age=0',
    'Pragma': 'no-cache',
    'Connection': 'close',
    'Content-Type': 'multipart/x-mixed-replace; boundary=--myboundary'
  })

  let stream = streams.get(printerIp)

  if (!stream) {
    // Start ffmpeg
    const rtspUrl = `rtsp://${printerIp}:554/stream`
    const ffmpeg = spawn('ffmpeg', [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mjpeg',
      '-r', '15',
      '-q:v', '5',
      '-an',
      '-'
    ])

    stream = {
      process: ffmpeg,
      clients: new Set(),
      lastActive: Date.now()
    }
    streams.set(printerIp, stream)

    let lastFrame: Buffer | undefined

    ffmpeg.stdout.on('data', (data: Buffer) => {
      // Very naive boundary injection (in real life we should parse JPEGs properly,
      // but ffmpeg with -f mjpeg already generates JPEGs back to back. 
      // Express might need manual multipart wrapping or we just write it.
      // A better way is using an existing package, but let's do a basic manual approach:
      // -f mpjpeg instead of mjpeg gives multipart directly!
    })

    // Actually, ffmpeg supports -f mpjpeg which outputs boundary out of the box!
    ffmpeg.kill()
    const ffmpegMpjpeg = spawn('ffmpeg', [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl,
      '-f', 'mpjpeg',
      '-r', '15',
      '-q:v', '5',
      '-an',
      '-'
    ])
    
    stream.process = ffmpegMpjpeg

    ffmpegMpjpeg.stdout.on('data', (data: Buffer) => {
      stream!.clients.forEach(client => {
        client.write(data)
      })
    })

    ffmpegMpjpeg.stderr.on('data', () => {
      // ignore ffmpeg logs
    })

    ffmpegMpjpeg.on('close', () => {
      stream!.clients.forEach(client => client.end())
      streams.delete(printerIp)
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
          streams.delete(printerIp)
        }
      }, 5000) // Keep alive for 5 seconds in case of quick refresh
    }
  })
}
