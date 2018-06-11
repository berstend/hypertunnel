'use strict'

const { test } = require('ava')

const hypertunnelClient = require('.')

test('is an object', async (t) => {
  t.is(typeof hypertunnelClient, 'object')
})

test('has expected exports', async (t) => {
  t.is(typeof hypertunnelClient.Client, 'function')
})
