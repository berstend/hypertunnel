'use strict'

const fs = require('fs')
const tls = require('tls')

const debug = require('debug')('relay:server:tlsRelayServer')

const { RelayServer } = require('./RelayServer')
const { Listener } = require('./Listener')

class TLSRelayServer extends RelayServer {
  get InternetListener () { return TLSInternetListener }
}

class TLSInternetListener extends Listener {
  /**
   * Overload server creation to terminate TLS on internetListener.
   *
   * @return {tls.Server}
   */
  createServer () {
    const opts = this.options.internetListener
    if (!opts || !opts.tlsOptions || !opts.tlsOptions.key) {
      debug('Warning, insufficient options: %o', opts)
      return super.createServer()
    }
    try {
      const getFile = (file) => (file instanceof Buffer) ? file : fs.readFileSync(file)
      const tlsOptions = {
        key: getFile(this.options.internetListener.tlsOptions.key),
        cert: getFile(this.options.internetListener.tlsOptions.cert),
        ca: getFile(this.options.internetListener.tlsOptions.ca)
      }
      return tls.createServer(tlsOptions, (socket) => {
        this.createClient(socket)
      })
    } catch (err) {
      debug('Warning, an error occured:', err)
      return super.createServer()
    }
  }
}

module.exports = {
  TLSRelayServer,
  TLSInternetListener
}
