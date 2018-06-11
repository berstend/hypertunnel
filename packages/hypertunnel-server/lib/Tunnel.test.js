'use strict'

const { test } = require('ava')

const Tunnel = require('./Tunnel')

test('is a function', async (t) => {
  t.is(typeof Tunnel, 'function')
})

test('has expected members', async (t) => {
  const instance = new Tunnel(666, 'foobar', { secret: 'hello' })
  t.is(instance.internetPort, 666)
  t.is(instance.relay, 'foobar')
  t.is(instance.secret, 'hello')
  t.true(!!instance.createdAt)
})
