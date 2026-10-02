import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.novafleet.android',
  appName: 'Nova 3D Printer Manager',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
}

export default config
