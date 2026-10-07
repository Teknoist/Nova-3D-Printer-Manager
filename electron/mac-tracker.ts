/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, no-empty */
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { PrinterStore } from './store.js'
import { NovaClient } from './nova-client.js'
import type { PrinterConfig } from '../src/shared/types.js'

const execAsync = promisify(exec)

function normalizeMac(mac: string) {
  return mac.toLowerCase().replace(/-/g, ':')
}

export async function getArpTable(): Promise<Map<string, string>> {
  const map = new Map<string, string>() // mac -> ip
  try {
    const { stdout } = await execAsync('arp -a')
    const lines = stdout.split('\n')
    for (const line of lines) {
      const match = line.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/)
      const ip = match?.[0]
      const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/)
      const mac = macMatch?.[0]
      if (ip && mac) {
        map.set(normalizeMac(mac), ip)
      }
    }
  } catch (error) {
    console.error('ARP tablosu okunamadı:', error)
  }
  return map
}

export async function findMacForIp(ip: string): Promise<string | undefined> {
  const table = await getArpTable()
  for (const [mac, tableIp] of table.entries()) {
    if (tableIp === ip) return mac
  }
  return undefined
}

export function startMacTracking(store: PrinterStore, onIpUpdated: (config: PrinterConfig) => void) {
  setInterval(async () => {
    const printers = await store.list()
    const table = await getArpTable()

    for (const printer of printers) {
      if (!printer.macAddress) {
        // Try to resolve missing mac address
        let resolvedMac: string | undefined
        for (const [mac, tableIp] of table.entries()) {
          if (tableIp === printer.host) {
            resolvedMac = mac
            break
          }
        }
        if (resolvedMac) {
          console.log(`MAC adresi bulundu: ${printer.name} -> ${resolvedMac}`)
          const updatedConfig = { ...printer, macAddress: resolvedMac }
          await store.save(updatedConfig)
        }
        continue
      }
      
      const currentIpInArp = table.get(normalizeMac(printer.macAddress))
      if (currentIpInArp && currentIpInArp !== printer.host) {
        console.log(`IP değişikliği tespit edildi: ${printer.name} (${printer.macAddress}) -> ${currentIpInArp}`)
        const updatedConfig = { ...printer, host: currentIpInArp }
        await store.save(updatedConfig)
        onIpUpdated(updatedConfig)
      }
    }
  }, 30_000)
}

