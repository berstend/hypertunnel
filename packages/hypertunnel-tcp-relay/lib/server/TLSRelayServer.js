'use strict'

const fs = require('fs')
const tls = require('tls')

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
    const tlsOptions = {
      key: fs.readFileSync(this.options.internetListener.tlsOptions.key),
      cert: fs.readFileSync(this.options.internetListener.tlsOptions.cert),
      ca: fs.readFileSync(this.options.internetListener.tlsOptions.ca)
    }
    return tls.createServer(tlsOptions, (socket) => {
      this.createClient(socket)
    })
  }
}

module.exports = {
  TLSRelayServer,
  TLSInternetListener
}
