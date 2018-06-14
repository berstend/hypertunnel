'use strict'

const { test } = require('ava')

const path = require('path')
const http = require('http')
const got = require('got')

const { TLSRelayServer } = require('../').Server
const { RelayClient } = require('../').Client

const certfolder = path.join(__dirname, '_fixtures', 'self-signed-certs')

const tlsOptions = {
  key: path.join(certfolder, 'server-key.pem'),
  cert: path.join(certfolder, 'server-crt.pem'),
  ca: path.join(certfolder, 'ca-crt.pem')
}

test('will create a usable tunnel with https', async (t) => {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const demoOptions = {
    relayPort: 10080,
    internetPort: 10081,
    webserverPort: 10020,
    webserverResponse: `Hello, wayfaring stranger. ${new Date()}`,
    host: 'localhost'
  }

  // create local web server for testing
  const localServer = await new Promise(resolve => {
    const _ = http.createServer((req, res) => {
      res.setHeader('X-Hello', 'Hi there')
      res.writeHead(200)
      res.end(demoOptions.webserverResponse)
    }).listen(demoOptions.webserverPort, () => resolve(_))
  })

  // create tls server
  const server = new TLSRelayServer({
    relayPort: demoOptions.relayPort,
    internetPort: demoOptions.internetPort
  }, { internetListener: { tlsOptions } })

  const client = new RelayClient({
    host: demoOptions.host,
    port: demoOptions.webserverPort,
    relayHost: demoOptions.host,
    relayPort: demoOptions.relayPort
  }, { })

  // test local server through tunnel created by client
  t.is((await got(`https://${demoOptions.host}:${demoOptions.internetPort}`)).body, demoOptions.webserverResponse)

  // shutdown everything
  localServer.close()
  server.end()
  client.end()

  t.pass()
})

test('will create a usable tunnel with https and secret', async (t) => {
  // Don't reject self signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  const demoOptions = {
    secret: 'foobar2000',
    relayPort: 10070,
    internetPort: 10071,
    webserverPort: 10010,
    webserverResponse: `Hello, wayfaring stranger. ${new Date()}`,
    host: 'localhost'
  }

  // create local web server for testing
  const localServer = await new Promise(resolve => {
    const _ = http.createServer((req, res) => {
      res.setHeader('X-Hello', 'Hi there')
      res.writeHead(200)
      res.end(demoOptions.webserverResponse)
    }).listen(demoOptions.webserverPort, () => resolve(_))
  })

  // create tls server
  const server = new TLSRelayServer({
    relayPort: demoOptions.relayPort,
    internetPort: demoOptions.internetPort
  }, {
    internetListener: { tlsOptions },
    secret: demoOptions.secret,
    timeout: 20
  })

  const client = new RelayClient({
    host: demoOptions.host,
    port: demoOptions.webserverPort,
    relayHost: demoOptions.host,
    relayPort: demoOptions.relayPort
  }, { secret: 'asas', retry: false })

  // make sure there is no connection
  try {
    await got(`https://${demoOptions.host}:${demoOptions.internetPort}`)
    t.fail()
  } catch (err) {
    t.is(err.name, 'RequestError')
  }

  // shutdown everything
  localServer.close()
  server.end()
  client.end()

  t.pass()
})
