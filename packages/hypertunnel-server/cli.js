#!/usr/bin/env node
'use strict'

const program = require('commander')

const { Server } = require('.')
const { version } = require('./package')

module.exports = async (argv) => {
  program
    .version(version, '-v, --version')
    .option('-p, --port [port]', 'web server port', 3000)
    .option('-d, --domain [domain]', 'public web server domain', 'hypertunnel.lvh.me')
    .option('-t, --token [token]', 'token required to be sent by clients', 'free-server-please-be-nice')
    .option('-f, --tokenFile [tokenFile]', 'file with token per port required to be sent by clients', '')
    .parse(argv)

  const server = new Server({
    serverPort: program.port,
    serverDomain: program.domain,
    serverToken: program.token,
    serverTokenFile: program.tokenFile
  })
  await server.create()

  process.on('uncaughtException', (err) => {
    console.error(err)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error(reason)
  })
}

module.exports(process.argv)
