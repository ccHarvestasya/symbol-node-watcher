import { ConfigManager } from './ConfigManager.js'
import { Logger } from './util/Logger.js'
import NodeWatch from './NodeWatch.js'

/** コマンドライン引数 */
const args = process.argv.slice(2)

/** 監視スタート */
try {
  const config = ConfigManager.loadConfig(args[1])
  new NodeWatch(args[0], config).startCron()
} catch (err) {
  new Logger(args[0]).error(err)
}
