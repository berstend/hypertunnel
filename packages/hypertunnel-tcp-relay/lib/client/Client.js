'use strict'

const net = require('net')
const tls = require('tls')
const EventEmitter = require('events').EventEmitter

const Debug = require('debug')
const DEBUG_NAMESPACE = 'relay:client:client'

class Client extends EventEmitter {
  constructor (opts = { host: null, port: null, relayHost: null, relayPort: null }, options = { }, index = 0) {
    super()

    this.debug = Debug(`${DEBUG_NAMESPACE}:${index}`)
    this.debug('constructor: %o', { opts, options })
    this.opts = opts
    this.options = options

    this.serviceSocket = undefined
    this.bufferData = true
    this.buffer = []

    this.relaySocket = this.options.tls ? this.createSecureRelaySocket() : this.createRelaySocket()
    this.relaySocket.on('data', this.onRelaySocketData.bind(this))
    this.relaySocket.on('end', () => this.emit('bytes', {tx: this.relaySocket.bytesWritten, rx: this.relaySocket.bytesRead}))
    this.relaySocket.on('close', this.onRelaySocketClose.bind(this))
    this.relaySocket.on('error', this.onRelaySocketError.bind(this))
  }

  createRelaySocket () {
    this.debug('relaySocket:create')
    const socket = new net.Socket()
    return socket.connect(this.opts.relayPort, this.opts.relayHost, this.onRelaySocketConnect.bind(this))
  }

  createSecureRelaySocket () {
    this.debug('relaySocket:createSecure')
    return tls.connect(this.opts.relayPort, this.opts.relayHost, {
      rejectUnauthorized: this.options.rejectUnauthorized
    }, this.onRelaySocketConnect.bind(this))
  }

  onRelaySocketConnect () {
    this.debug('relaySocket:onConnect')
    this.authorize()
  }

  onRelaySocketData (data) {
    this.debug('relaySocket:onData')
    if (!this.serviceSocket) {
      this.emit('pair')
      this.createServiceSocket()
    }
    if (this.bufferData) {
      this.buffer[this.buffer.length] = data
    } else {
      this.serviceSocket.write(data)
    }
  }

  onRelaySocketClose (hadError) {
    this.debug('relaySocket:onClose', { hadError })
    if (this.serviceSocket) {
      this.serviceSocket.destroy()
    } else {
      this.emit('close')
    }
  }

  onRelaySocketError (error) {
    this.debug('relaySocket:onError', error)
  }

  authorize () {
    this.debug('authorize: %o', { secret: this.options.secret })
    if (this.options.secret) {
      this.relaySocket.write(this.options.secret)
    }
  }

  createServiceSocket () {
    this.debug('serviceSocket:create')
    this.serviceSocket = new net.Socket()
    this.serviceSocket.connect(this.opts.port, this.opts.host, this.onServiceSocketConnect.bind(this))
    this.serviceSocket.on('data', this.onServiceSocketData.bind(this))
    this.serviceSocket.on('error', this.onServiceSocketError.bind(this))
  }

  onServiceSocketConnect () {
    this.debug('serviceSocket:onConnect')
    this.bufferData = false
    if (this.buffer.length > 0) {
      for (let i = 0; i < this.buffer.length; i++) {
        this.serviceSocket.write(this.buffer[i])
      }
      this.buffer.length = 0
    }
  }

  onServiceSocketData (data) {
    this.debug('serviceSocket:onData')
    try {
      this.relaySocket.write(data)
    } catch (err) {
      this.debug('serviceSocket:onData:writeError', err)
    }
  }

  onServiceSocketError (error) {
    this.debug('serviceSocket:onError', error)
    this.relaySocket.end()
  }
}

module.exports = { Client }
