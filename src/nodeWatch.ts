import fetch from 'node-fetch'
import { exec } from 'child_process'
import { Catapult } from './catapult/Catapult.js'
import { Logger } from './util/Logger.js'
import cron from 'node-cron'
import { Config } from './ConfigManager.js'

const ERROR_MESSAGES = {
  SYMBOL_SERVICE_UNABILABLE: 'symbol.servicesが正常に稼働していません',
  YOUR_NODE_IS_UNABILABLE: 'あなたのノードが正常に稼働していません',
  NODE_HEIGHT: 'ブロック高が異常です',
  NODE_FINALIZED_HEIGHT: 'ファイナライズ高が異常です',
}

type NodeInfo = {
  name: string
  height: number
  finalizedHeight: number
}

let nodesInfo: NodeInfo[] = []

export default class NodeWatch {
  logger: Logger
  config: Config

  constructor(apName: string, config: Config) {
    this.config = config
    this.logger = new Logger(apName)
  }

  /**
   * Cron開始
   */
  startCron = () => {
    cron.schedule(this.config.cronExpression, () => this.start())
  }

  /**
   * 監視チェック開始
   */
  private start = async (): Promise<void> => {
    this.logger.info('=== start watcher ===')

    try {
      let nodeList: unknown
      try {
        const symbolServiceResponse = await this.fetchJSON(this.config.symbolServiceUrl)
        nodeList = symbolServiceResponse
      } catch (e: any) {
        this.logger.error(`${ERROR_MESSAGES.SYMBOL_SERVICE_UNABILABLE}: ${e.message}`)
        this.sendMessage(`${ERROR_MESSAGES.SYMBOL_SERVICE_UNABILABLE}: ${e.message}`)
      }

      if (Array.isArray(nodeList)) {
        for (const node of nodeList) {
          try {
            const chainInfo = (await this.fetchJSON(`http://${node.host}:3000/chain/info`)) as any
            nodesInfo.push({
              name: node.host,
              height: Number(chainInfo.height),
              finalizedHeight: Number(chainInfo.latestFinalizedBlock.height),
            })
          } catch (e: any) {
            console.error(`Error fetching chain info for node ${node.host}: ${e.message}`)
          }
        }
      }
      const maxNode = nodesInfo.reduce((max, node) => (node.height > max.height ? node : max), nodesInfo[0])
      this.logger.info(`maxNodeHost            : ${maxNode.name}`)

      let yourNodeChainInfo
      if (this.config.enablePeerCheck) {
        try {
          const host = this.config.isDebug ? 'raki.harvestasya.com' : '127.0.0.1'
          this.logger.debug(`host: ${host}`)
          const catapult = new Catapult(this.config.certPath, '127.0.0.1', this.config.peerPort)
          const chainInfo = await catapult.getChainInfo()
          yourNodeChainInfo = chainInfo
        } catch (e) {
          this.logger.error(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.sendMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.nodeReboot()
          return
        }
      } else {
        let yourNodeChainInfoResponce
        try {
          const host = this.config.isDebug ? 'finnel.harvestasya.com' : '127.0.0.1'
          this.logger.debug(`host: ${host}`)
          yourNodeChainInfoResponce = await fetch(`http://${host}:3000/chain/info`)
        } catch {
          this.logger.error(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.sendMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.nodeReboot()
          return
        }

        if (yourNodeChainInfoResponce == undefined || !yourNodeChainInfoResponce.ok) {
          this.logger.error(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.sendMessage(ERROR_MESSAGES.YOUR_NODE_IS_UNABILABLE)
          this.nodeReboot()
          return
        }

        yourNodeChainInfo = (await yourNodeChainInfoResponce.json()) as any
      }

      const yourNodeHeight = Number(yourNodeChainInfo.height)
      const yourNodeFinalizedHeight = Number(yourNodeChainInfo.latestFinalizedBlock.height)
      this.logger.info(`yourNodeHeight         : ${yourNodeHeight}`)
      this.logger.info(`maxNode.height         : ${maxNode.height}`)
      this.logger.info(`yourNodeFinalizedHeight: ${yourNodeFinalizedHeight}`)
      this.logger.info(`maxNode.finalizedHeight: ${maxNode.finalizedHeight}`)

      if (maxNode.height - this.config.differenceHeight > yourNodeHeight) {
        const errorMessage = `${ERROR_MESSAGES.NODE_HEIGHT}\nあなたのブロック高: ${yourNodeHeight}\n正常ノードのブロック高${maxNode.height}`
        this.logger.error(errorMessage)
        this.sendMessage(errorMessage)
        this.nodeReboot()
        return
      }

      if (maxNode.finalizedHeight - this.config.differenceFinHeight > yourNodeFinalizedHeight) {
        const errorMessage = `${ERROR_MESSAGES.NODE_FINALIZED_HEIGHT}\nあなたのファイナライズブロック高: ${yourNodeFinalizedHeight}\n正常ノードのファイナライズブロック高${maxNode.finalizedHeight}`
        this.logger.error(errorMessage)
        this.sendMessage(errorMessage)
        this.nodeReboot()
        return
      }
    } catch (e: any) {
      this.sendMessage(e.message)
      console.error(e.message)
    }

    this.logger.info('=== e n d watcher ===')
  }

  private sendDiscordMessage = async (content: string) => {
    if (!this.config.discordWebhookUrl) return
    await fetch(this.config.discordWebhookUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'symbol node wather BOT',
        content,
        allowed_mentions: {},
      }),
    })
  }

  private sendMessage = async (content: string) => {
    await this.sendDiscordMessage(content)
  }

  private nodeReboot = () => {
    const timeoutMilliseconds = 120000
    const command = `cd ${this.config.nodePath} && ${this.config.stopCommand} && ${this.config.runCommand}`
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        this.logger.error(`ノード再起動エラー: ${error}`)
        this.sendMessage(`ノード再起動エラー: ${error}`)
        return
      }
      this.logger.info('正常に再起動が完了しました。確認してください。')
      this.sendMessage('正常に再起動が完了しました。確認してください。')
    })

    const timeout = setTimeout(() => {
      childProcess.kill()
      this.logger.error('ノード再起動がタイムアウトしました。')
      this.sendMessage('ノード再起動がタイムアウトしました。')
    }, timeoutMilliseconds)

    childProcess.on('exit', () => {
      clearTimeout(timeout)
    })
  }

  private fetchJSON = async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch ${url}`)
    return response.json()
  }
}
