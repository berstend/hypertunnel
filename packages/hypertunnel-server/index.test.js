'use strict'

const { test } = require('ava')

const hypertunnelServer = require('.')

test('is an object', async (t) => {
  t.is(typeof hypertunnelServer, 'object')
})

test('has expected exports', async (t) => {
  t.is(typeof hypertunnelServer.Server, 'function')
  t.is(typeof hypertunnelServer.Tunnel, 'function')
  t.is(typeof hypertunnelServer.TunnelManager, 'function')
})
