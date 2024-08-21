import log4js from 'log4js'

const logLevel = 'all'
// const logLevel = 'info'

log4js.configure({
  appenders: {
    SymbolNodeWatcher: {
      daysToKeep: 90,
      filename: 'symbol-node-watcher.log',
      keepFileExt: true,
      layout: { type: 'pattern', pattern: '[%d] [%-5p] %-10c %m' },
      pattern: 'yyyyMMdd',
      type: 'file',
    },
    stdout: { type: 'stdout' },
  },
  categories: {
    default: { appenders: ['stdout'], level: logLevel },
    SymbolNodeWatcher: { appenders: ['SymbolNodeWatcher', 'stdout'], level: logLevel },
  },
})

export class Logger {
  private logger_

  constructor(category?: string) {
    this.logger_ = log4js.getLogger(category)
  }

  debug(msg: any) {
    this.logger_.debug(msg)
  }

  error(msg: any) {
    this.logger_.error(msg)
  }

  fatal(msg: any) {
    this.logger_.fatal(msg)
  }

  info(msg: any) {
    this.logger_.info(msg)
  }

  trace(msg: any) {
    this.logger_.trace(msg)
  }

  warn(msg: any) {
    this.logger_.warn(msg)
  }

  shutdown(exitCode: string | number | undefined) {
    process.exitCode = exitCode
    log4js.shutdown(() => {
      process.on('exit', () => {
        process.exit(exitCode)
      })
    })
  }
}
