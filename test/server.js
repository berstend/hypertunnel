'use strict'

const { test } = require('ava')

const got = require('got')

const { Server } = require('hypertunnel-server')

test('can start and stop a server', async (t) => {
  const serverData = {
    serverPort: 60666,
    serverDomain: 'local.hypertunnel.lvh.me',
    serverToken: 'foobar-token'
  }
  const serverUrl = `http://${serverData.serverDomain}:${serverData.serverPort}`

  // create server
  const server = new Server(serverData)
  await server.create()

  // test created server
  const { body } = await got(`${serverUrl}/status`, { json: true })
  t.is(body.tunnels, 0)

  // close server
  await server.close()

  // confirm that server is closed
  try {
    await got(`${serverUrl}/status`, { json: true })
    t.fail()
  } catch (err) {
    t.is(err.name, 'RequestError')
  }
})
