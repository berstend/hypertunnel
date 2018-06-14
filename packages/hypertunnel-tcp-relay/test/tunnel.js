'use strict'

const { test } = require('ava')

const http = require('http')
const got = require('got')

const { RelayServer } = require('../').Server
const { RelayClient } = require('../').Client

test('will create a usable tunnel with http', async (t) => {
  const demoOptions = {
    relayPort: 11080,
    internetPort: 11081,
    webserverPort: 11020,
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
  const server = new RelayServer({
    relayPort: demoOptions.relayPort,
    internetPort: demoOptions.internetPort
  })

  const client = new RelayClient({
    host: demoOptions.host,
    port: demoOptions.webserverPort,
    relayHost: demoOptions.host,
    relayPort: demoOptions.relayPort
  }, { })

  // test local server through tunnel created by client
  t.is((await got(`http://${demoOptions.host}:${demoOptions.internetPort}`)).body, demoOptions.webserverResponse)

  // shutdown everything
  localServer.close()
  server.end()
  client.end()

  t.pass()
})

test('will create a usable tunnel with http and secret', async (t) => {
  const demoOptions = {
    secret: 'foobar2000',
    relayPort: 12070,
    internetPort: 12071,
    webserverPort: 12010,
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
  const server = new RelayServer({
    relayPort: demoOptions.relayPort,
    internetPort: demoOptions.internetPort
  }, {
    secret: demoOptions.secret,
    timeout: 20
  })

  const client = new RelayClient({
    host: demoOptions.host,
    port: demoOptions.webserverPort,
    relayHost: demoOptions.host,
    relayPort: demoOptions.relayPort
  }, { secret: 'invalid', retry: false })

  // make sure there is no connection
  try {
    await got(`http://${demoOptions.host}:${demoOptions.internetPort}`)
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
