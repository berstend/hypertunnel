#!/usr/bin/env node
'use strict'

const { Server } = require('hypertunnel-server')

async function main () {
  const server = new Server({
    serverPort: process.env.SERVER_PORT,
    serverDomain: process.env.SERVER_DOMAIN,
    serverToken: process.env.SERVER_TOKEN
  })
  await server.create()
}

main()
