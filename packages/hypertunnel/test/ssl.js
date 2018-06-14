'use strict'

const { test } = require('ava')

const http = require('http')
const got = require('got')

const { Client } = require('hypertunnel')
const { Server } = require('hypertunnel-server')

test('will create a usable https tunnel with --ssl', async (t) => {
  // Don't reject self signed certs
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

  // create server
  const serverData = {
    serverPort: 61555,
    serverDomain: 'local.hypertunnel.lvh.me',
    serverToken: 'foobar-token'
  }
  const serverUrl = `http://${serverData.serverDomain}:${serverData.serverPort}`
  const server = new Server(serverData)
  await server.create()

  // confirm that server is running and has no tunnels
  t.is((await got(`${serverUrl}/status`, { json: true })).body.tunnels, 0)

  // create local web server for testing
  const localServerData = {
    port: 51888,
    response: `Hello, wayfaring stranger. ${new Date()}`
  }
  const localServer = await new Promise(resolve => {
    const _ = http.createServer((req, res) => {
      res.writeHead(200)
      res.end(localServerData.response)
    }).listen(localServerData.port, () => resolve(_))
  })

  // test local server directly
  t.is((await got(`http://localhost:${localServerData.port}`)).body, localServerData.response)

  // create client to tunnel local web server
  const clientData = {
    host: 'localhost',
    server: serverUrl,
    token: serverData.serverToken,
    internetPort: 31999
  }
  const client = new Client(localServerData.port, clientData, { ssl: true })
  await client.create()

  // confirm that server knows about the new tunnel
  t.is((await got(`${serverUrl}/status`, { json: true })).body.tunnels, 1)

  // confirm that tunnel uri looks as expected
  t.is(client.uri, `${serverData.serverDomain}:${clientData.internetPort}`)

  // test local server through tunnel created by client
  t.is((await got(`${client.uri}`)).body, localServerData.response)

  // close client
  await client.close()

  // confirm that tunnel is closed
  try {
    await got(`${client.uri}`)
    t.fail()
  } catch (err) {
    t.is(err.name, 'RequestError')
  }

  // confirm that tunnel has been removed from the server
  t.is((await got(`${serverUrl}/status`, { json: true })).body.tunnels, 0)

  // close local web server and confirm
  localServer.close()
  try {
    await got(`http://localhost:${localServerData.port}`)
    t.fail()
  } catch (err) {
    t.is(err.name, 'RequestError')
  }

  // close server and confirm
  await server.close()
  try {
    await got(`${serverUrl}/status`, { json: true })
    t.fail()
  } catch (err) {
    t.is(err.name, 'RequestError')
  }
})
