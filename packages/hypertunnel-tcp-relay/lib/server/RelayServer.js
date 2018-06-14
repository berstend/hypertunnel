'use strict'

const EventEmitter = require('events').EventEmitter

const Debug = require('debug')
const DEBUG_NAMESPACE = 'relay:server:relayServer'

const { Listener } = require('./Listener')

class RelayServer extends EventEmitter {
  constructor (opts = { relayPort: null, internetPort: null }, options = { }) {
    super()
    this.debug = Debug(`${DEBUG_NAMESPACE}`)
    this.debug('constructor: %o', { opts, options })
    this.relayPort = opts.relayPort
    this.internetPort = opts.internetPort
    this.options = options

    this.relayListener = this.createRelayListener()
    this.internetListener = this.createInternetListener()

    this.relayListener.on('new', (client) => {
      this.debug('relayListener:onNew', { client: !!client })
      this.internetListener.pair(this.relayListener, client)
    })
    this.internetListener.on('new', (client) => {
      this.debug('internetListener:onNew', { client: !!client })
      this.relayListener.pair(this.internetListener, client)
    })
  }

  get RelayListener () { return Listener }
  get InternetListener () { return Listener }

  createRelayListener () {
    return new this.RelayListener(
      { port: this.relayPort },
      { ...this.options, bufferData: !!this.options.secret },
      { context: 'relay' }
    )
  }

  createInternetListener () {
    return new this.InternetListener(
      { port: this.internetPort },
      { internetListener: this.options.internetListener,
        hostname: this.options.hostname,
        bufferData: true,
        timeout: this.options.timeout || 20000 },
      { context: 'internet' }
    )
  }

  end () {
    this.relayListener.end()
    this.internetListener.end()
  }
}

module.exports = { RelayServer }
