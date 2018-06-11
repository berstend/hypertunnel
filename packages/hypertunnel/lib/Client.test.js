'use strict'

const { test } = require('ava')

const Client = require('./Client')

test('is a function', async (t) => {
  t.is(typeof Client, 'function')
})

test('has expected members', async (t) => {
  const instance = new Client(9090)
  t.is(instance.port, 9090)
  t.is(typeof instance.create, 'function')
  t.is(typeof instance.delete, 'function')
  t.is(typeof instance.close, 'function')
})
