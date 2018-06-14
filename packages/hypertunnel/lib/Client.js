'use strict'

const debug = require('debug')('hypertunnel:client')

const { RelayClient } = require('hypertunnel-tcp-relay').Client
const parseUrl = require('url-parse')
const got = require('got')

/**
 * A hypertunnel client.
 */
class Client {
  constructor (port, opts = {}, options = { ssl: false }) {
    this.port = port
    this.host = opts.host || 'localhost'
    this.server = opts.server || 'https://hypertunnel.ga'
    this.serverParts = parseUrl(this.server)
    this.token = opts.token || 'free-server-please-be-nice'
    this.desiredInternetPort = opts.internetPort
    this.options = options

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
      internetPort: this.desiredInternetPort,
      ssl: this.options.ssl
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

    this.relay = new RelayClient({
      host: this.host,
      port: this.port,
      relayHost: this.serverParts.hostname,
      relayPort: this.relayPort
    }, { secret: this.secret })
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
