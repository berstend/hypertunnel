'use strict'

const fs = require('fs')
const net = require('net')
const tls = require('tls')
const EventEmitter = require('events').EventEmitter

const Debug = require('debug')
const DEBUG_NAMESPACE = 'relay:server:listener'

const { Client } = require('./Client')

class Listener extends EventEmitter {
  constructor (opts = { port: null }, options = { }, { context = '' }) {
    super()
    this.debug = Debug(`${DEBUG_NAMESPACE}:${context}`)
    this.debug('constructor: %o', { opts, options })

    this.port = opts.port
    this.options = options
    this.context = context

    this.pending = []
    this.active = []

    this.server = this.createServer()
    this.server.listen(this.port, this.options.hostname)
  }

  get Client () { return Client }

  createServer () {
    this.debug('createServer', { tls: this.options.tls })
    let server = null

    if (this.options.tls === true) {
      const tlsOptions = {
        pfx: fs.readFileSync(this.options.pfx),
        passphrase: this.options.passphrase
      }
      server = tls.createServer(tlsOptions, (socket) => {
        this.createClient(socket)
      })
    } else {
      server = net.createServer((socket) => {
        this.createClient(socket)
      })
    }
    return server
  }

  createClient (socket) {
    this.debug('createClient', { socket: !!socket, timeout: this.options.timeout })
    const client = new this.Client(
      { socket },
      { secret: this.options.secret,
        bufferData: this.options.bufferData,
        timeout: this.options.timeout },
      { context: this.context }
    )

    client.on('close', () => this.onClientClose(client))

    if (this.options.secret) {
      client.on('authorized', () => this.onClientAuthorized(client))
    } else {
      this.emit('new', client)
    }
  }

  onClientClose (client) {
    this.debug('client:onClose', { pending: this.pending.length })
    var i = this.pending.indexOf(client)
    if (i !== -1) {
      this.pending.splice(i, 1)
    } else {
      i = this.active.indexOf(client)
      if (i !== -1) {
        this.active.splice(i, 1)
      }
    }
  }

  onClientAuthorized (client) {
    this.debug('client:onAuthorized')
    this.emit('new', client)
  }

  end () {
    this.debug('end')
    this.server.close()
    for (let i = 0; i < this.pending.length; i++) {
      const client = this.pending[i]
      client.socket.destroy()
    }
    for (let i = 0; i < this.active.length; i++) {
      const client = this.active[i]
      client.socket.destroy()
    }
    this.server.unref()
  }

  pair (other, client) {
    this.debug('pair', { pending: this.pending.length })
    if (this.pending.length > 0) {
      var thisClient = this.pending[0]
      this.pending.splice(0, 1)
      client.pairedSocket = thisClient.socket
      thisClient.pairedSocket = client.socket
      this.active[this.active.length] = thisClient
      other.active[other.active.length] = client
      client.writeBuffer()
      thisClient.writeBuffer()
    } else {
      other.pending.push(client)
    }
  }
}

module.exports = { Listener }
