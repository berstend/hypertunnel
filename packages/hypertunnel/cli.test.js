'use strict'

const { test } = require('ava')

const execa = require('execa')

test('--version', async (t) => {
  const { stdout } = await execa('./cli.js', [ '--version' ])
  t.true(stdout.length > 0)
})
