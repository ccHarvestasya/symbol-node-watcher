import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Logger } from './util/Logger.js'
import pm2 from 'pm2'

/**
 * pm2接続
 */
const pm2Connect = async (): Promise<void> => {
  return await new Promise<void>((resolve, reject) => {
    pm2.connect((err) => {
      if (err) reject(err)
      resolve()
    })
  })
}

/**
 * pm2開始
 * @param script スクリプトパス
 * @param name AP名
 * @param nodeArgs node引数
 */
const pm2Start = async (script: string, name: string, nodeArgs: string): Promise<void> => {
  return await new Promise<void>((resolve, reject) => {
    pm2.start(
      {
        script: script,
        name: name,
        node_args: `${script} ${nodeArgs}`,
        interpreter: 'node',
      },
      (err, _apps) => {
        if (err) reject(err)
        logger.debug(`${script} ${nodeArgs}`)
        resolve()
      }
    )
  })
}

/**
 * pm2停止&削除
 * @param name AP名
 */
const pm2StopDelete = async (name: string): Promise<void> => {
  return await new Promise<void>((resolve, reject) => {
    pm2.stop(name, (err, _proc) => {
      if (err) reject(err)
      pm2.delete(name, (err, _proc) => {
        if (err) reject(err)
        resolve()
      })
    })
  })
}

/**
 * pm2プロセス情報
 * @returns プロセス情報
 */
const pm2List = async (): Promise<pm2.ProcessDescription[]> => {
  return await new Promise<pm2.ProcessDescription[]>((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) reject(err)
      resolve(list)
    })
  })
}

/**
 * pm2起動チェック
 * @param name AP名
 * @returns true: 起動中
 */
const isRunning = async (name: string): Promise<boolean> => {
  const list = await pm2List()
  const res = list.filter((item) => item.name === name)
  if (res.length === 1 && res[0].pm2_env?.status && res[0].pm2_env.status.toString() === 'online') return true
  return false
}

/** AP名 */
const apName = 'SymbolNodeWatcher'

/** ロガー */
const logger = new Logger(apName)

/** コマンドライン引数 */
const args = process.argv.slice(2)

/** 実行JSファイル */
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(dirname(__filename))
const serviceJs = join(__dirname, './dist/nodeWatcherStarter.js')
logger.debug(`serviceJs: ${serviceJs}`)

/** 各コマンド処理 */
try {
  await pm2Connect()

  switch (args[0]) {
    case 'start':
      if (await isRunning(apName)) {
        logger.info(`すでに実行しています。`)
      } else {
        await pm2Start(serviceJs, apName, `${apName} ${args[1] ?? './config.json'}`)
        if (await isRunning(apName)) logger.info(`起動しました。`)
      }
      break

    case 'stop':
      if (await isRunning(apName)) {
        await pm2StopDelete(apName)
        if (await isRunning(apName)) logger.info(`停止しました。`)
      } else {
        logger.info(`すでに停止しています。`)
      }
      break

    default:
      logger.error(`Unknown command: ${args[0]}`)
      logger.shutdown(1)
      break
  }
} catch (err) {
  logger.error(err)
  logger.shutdown(2)
}

pm2.disconnect()
