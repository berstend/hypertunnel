'use strict'

const debug = require('debug')('hypertunnel:client')

const relayClient = require('node-tcp-relay')
const parseUrl = require('url-parse')
const got = require('got')

/**
 * A hypertunnel client.
 */
class Client {
  constructor (port, opts = {}) {
    this.port = port
    this.host = opts.host || 'localhost'
    this.server = opts.server || 'https://api.hypertunnel.ga'
    this.serverParts = parseUrl(this.server)
    this.token = opts.token || 'free-server-please-be-nice'
    this.desiredInternetPort = opts.internetPort

    this.deleted = false
    this.relay = null
    this.internetPort = null
    this.relayPort = null
    this.uri = null
    this.secret = null
    this.createdAt = null
    this.expiresIn = null
    this.serverBanner = null

    debug(`created`, this)
  }

  async create () {
    const payload = {
      serverToken: this.token,
      internetPort: this.desiredInternetPort
    }
    const { body } = await got(`${this.server}/create`, { json: true, body: payload, throwHttpErrors: false })
    debug('create', body)
    if (!body.success) { throw new Error(body && body.message ? body.message : 'Unexpected response') }
    this.createdAt = body.createdAt
    this.internetPort = body.internetPort
    this.relayPort = body.relayPort
    this.secret = body.secret
    this.uri = body.uri
    this.expiresIn = body.expiresIn
    this.serverBanner = body.serverBanner

    this.relay = relayClient.createRelayClient(this.host, this.port, this.serverParts.hostname, this.relayPort, { secret: this.secret, numConn: 1 })
    return this
  }

  async delete () {
    if (this.deleted) { return true }
    const payload = {
      serverToken: this.token,
      internetPort: this.internetPort,
      secret: this.secret
    }
    const { body } = await got(`${this.server}/delete`, { json: true, body: payload, throwHttpErrors: false })
    debug('delete', body)
    if (!body.success) { throw new Error(body && body.message ? body.message : 'Unexpected response') }
    this.deleted = true
    return true
  }

  async close () {
    this.relay.end()
    await this.delete()
    return true
  }
}

module.exports = Client
