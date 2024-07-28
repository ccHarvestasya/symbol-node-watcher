import * as fs from 'fs'

export interface Config {
  nodePath: string
  discordWebhookUrl: string
  cronExpression: string
  symbolServiceUrl: string
  differenceHeight: number
  stopCommand: string
  runCommand: string
  enablePeerCheck: boolean
  peerPort: number
  certPath: string
}

export function loadConfig(configFilePath: string | undefined): Config {
  try {
    const configData = fs.readFileSync(configFilePath ? configFilePath : './config.json', 'utf-8')
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
}
