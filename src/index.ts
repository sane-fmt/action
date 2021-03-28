import { group, setFailed, getInput, addPath, setOutput } from '@actions/core'
import { spawnSync } from 'child_process'
import fs from 'fs'
import { safeLoad } from 'js-yaml'
import fetch from 'node-fetch'
import path from 'path'
import { platform, exit } from 'process'
import tempPath from 'unique-temp-path'
import { upstreamVersion } from './upstream-version.json'

const location = tempPath('sane-fmt.')
const executableBaseName = platform === 'win32' ? 'sane-fmt.exe' : 'sane-fmt'
const executablePath = path.join(location, executableBaseName)
const upstreamUrlPrefix = 'https://github.com/sane-fmt/sane-fmt/releases/download'
const upstreamBaseNames: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'sane-fmt-x86_64-apple-darwin',
  linux: 'sane-fmt-x86_64-unknown-linux-gnu',
  win32: 'sane-fmt-x86_64-pc-windows-gnu.exe',
}
const upstreamUrl = [
  upstreamUrlPrefix,
  upstreamVersion,
  upstreamBaseNames[platform],
].join('/')

function parseBoolean(value: string, inputName: string): boolean {
  switch (value.toLowerCase()) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      setFailed(`Input "${inputName}" is not a boolean: "${value}"`)
      throw exit(1)
  }
}

const getBooleanInput = (name: string) => parseBoolean(getInput(name), name)

async function main() {
  const args = safeLoad(getInput('args'))
  const actionLogs = getBooleanInput('action-logs')
  const exportPath = getBooleanInput('export-path')
  const shouldRun = getBooleanInput('run')

  if (!Array.isArray(args)) {
    setFailed(
      new TypeError(`Input "args" is not an array: ${JSON.stringify(args)}`),
    )
    return
  }

  setOutput('location', location)
  setOutput('executable-basename', executableBaseName)
  setOutput('executable-path', executablePath)
  if (exportPath) addPath(location)

  await group('Installing sane-fmt', async () => {
    console.log(`Creating directory ${location}`)
    fs.mkdirSync(location)

    console.log(`Downloading ${upstreamUrl} into ${executablePath}`)
    const writer = fs.createWriteStream(executablePath)
    const response = await fetch(upstreamUrl)
    response.body.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.once('error', reject)
      writer.once('close', resolve)
    })

    console.log(`Making ${executablePath} executable`)
    fs.chmodSync(executablePath, 0o755)
  })

  if (!shouldRun) {
    console.log('run is false, skipping run')
    return
  }

  if (actionLogs) args.push('--log-format=github-actions')
  const { error, status } = spawnSync(executablePath, args, {
    stdio: 'inherit',
  })
  if (error) {
    setFailed(error)
    return
  }
  if (status) {
    throw exit(status)
  }
}

main().catch(setFailed)
