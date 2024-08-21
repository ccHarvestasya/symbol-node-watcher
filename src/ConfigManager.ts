import * as fs from 'node:fs'

export interface Config {
  nodePath: string
  discordWebhookUrl: string
  cronExpression: string
  symbolServiceUrl: string
  differenceHeight: number
  differenceFinHeight: number
  stopCommand: string
  runCommand: string
  enablePeerCheck: boolean
  peerPort: number
  certPath: string
  isDebug?: boolean
}

export const ConfigManager = {
  loadConfig(configFilePath?: string): Config {
    try {
      const configData = fs.readFileSync(configFilePath ? configFilePath : './config.json', 'utf8')
      const config: Config = JSON.parse(configData)

      if (config.nodePath == '' || config.nodePath == undefined) throw new Error('can not find node path')

      if (config.enablePeerCheck) {
        if ((config.certPath == '' || config.certPath == undefined) && config.peerPort == undefined) {
          throw new Error('can not find peer info')
        }
      }

      return JSON.parse(configData)
    } catch (error) {
      throw new Error('Error loading config file')
    }
  },
}
