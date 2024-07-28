import cron from 'node-cron'
import NodeWatch from './nodeWatch.js'
import { loadConfig } from './config.js'
import { join } from 'path'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
const args = process.argv.slice(2)

const PID_FILE_PATH = join('./', 'process.pid')
if (args[0] === 'start') {
  startTask()
} else if (args[0] === 'stop') {
  stopTask()
} else {
  console.error('Unknown command')
}
function startTask() {
  if (existsSync(PID_FILE_PATH)) {
    console.log('already watching.')
  } else {
    const config = loadConfig(args[1])
    const cronExpression = config.cronExpression
    console.log(config)
    const nodeWatch = new NodeWatch(config)
    cron.schedule(cronExpression, () => {
      nodeWatch.start()
    })
    console.log('started to watch node.')
    writeFileSync(PID_FILE_PATH, process.pid.toString())
  }
}
function stopTask() {
  if (existsSync(PID_FILE_PATH)) {
    const pid = parseInt(readFileSync(PID_FILE_PATH, 'utf8').trim())
    process.kill(pid)
    console.log('stopped to watch node.')
    unlinkSync(PID_FILE_PATH)
  } else {
    console.log('not watching.')
  }
}
