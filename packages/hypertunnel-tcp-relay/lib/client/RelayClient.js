'use strict'

const EventEmitter = require('events').EventEmitter

const Debug = require('debug')
const DEBUG_NAMESPACE = 'relay:client:relayClient'

const { Client } = require('./Client')

class RelayClient extends EventEmitter {
  constructor (opts = { host: null, port: null, relayHost: null, relayPort: null }, options = { }) {
    super()
    this.debug = Debug(`${DEBUG_NAMESPACE}`)
    this.debug('constructor: %o', { opts, options })

    this.opts = opts
    this.options = options
    this.retry = options.retry || true

    this.pairCount = 0
    this.bytes = { tx: 0, rx: 0 }
    this.client = this.createClient()
  }

  get Client () { return Client }

  get status () {
    const status = {
      pairCount: this.pairCount,
      bytes: this.bytes,
      client: !!this.client,
      relaySocket: !!(this.client || {}).relaySocket,
      serviceSocket: !!(this.client || {}).serviceSocket
    }
    return status
  }

  createClient () {
    const client = new this.Client(this.opts, this.options)
    client.on('pair', this.onClientPair.bind(this))
    client.on('close', this.onClientClose.bind(this))
    client.on('bytes', this.onClientBytes.bind(this))
    return client
  }

  onClientPair () {
    this.pairCount += 1
    this.debug('onClientPair', { pairCount: this.pairCount })
    this.client = this.createClient()
  }

  onClientClose () {
    this.debug('onClientClose', { endCalled: this.endCalled, retry: this.retry })
    this.client = null

    // Reconnect on connection loss
    if (this.retry) {
      setTimeout(() => {
        if (this.endCalled) { return }
        this.client = this.createClient()
      }, 5000)
    }
  }

  onClientBytes ({ tx = 0, rx = 0 }) {
    this.bytes.tx += tx
    this.bytes.rx += rx
    this.debug('onClientBytes: %o', this.bytes)
  }

  end () {
    this.debug('end', { endCalled: this.endCalled })
    this.endCalled = true
    try {
      this.client.removeAllListeners()
      this.client.relaySocket.destroy()
    } catch (err) {
      this.debug('end:error: %o', err)
    }
  }
}

module.exports = { RelayClient }
