'use strict'

const { test } = require('ava')

const TunnelManager = require('./TunnelManager')

test('is a function', async (t) => {
  t.is(typeof TunnelManager, 'function')
})

test('has expected members', async (t) => {
  const instance = new TunnelManager()
  t.is(typeof instance.tunnels, 'object')
  t.is(typeof instance.newTunnel, 'function')
  t.is(typeof instance.removeAll, 'function')
})
