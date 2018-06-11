'use strict'

const { test } = require('ava')

const Server = require('./Server')

test('is a function', async (t) => {
  t.is(typeof Server, 'function')
})

test('has expected members', async (t) => {
  const instance = new Server()
  t.is(typeof instance.create, 'function')
  t.is(typeof instance.close, 'function')
})
