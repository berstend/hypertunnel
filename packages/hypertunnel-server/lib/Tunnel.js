'use strict'

const debug = require('debug')('hypertunnel:tunnel')

/**
 * A tunnel holds the relation of an internet port and a hypertunnel-tcp-relay server.
 */
class Tunnel {
  constructor (internetPort, relay, opts = {}) {
    this.internetPort = internetPort
    this.relay = relay
    this.secret = opts.secret
    this.ssl = opts.ssl
    this.createdAt = new Date()

    // todo: tie tcp-relay events to Tunnel
    // this.relay.relayListener.on('new', (e) => debug('relayListener new', e))
    // this.relay.relayListener.on('close', (e) => debug('relayListener close', e))

    debug(`created`, {internetPort, relay})
  }
}

module.exports = Tunnel
