'use strict'

const EventEmitter = require('events').EventEmitter

const Debug = require('debug')
const DEBUG_NAMESPACE = 'relay:server:client'

class Client extends EventEmitter {
  constructor (opts = { socket: null }, options = { }, { context = '' }) {
    super()
    this.debug = Debug(`${DEBUG_NAMESPACE}:${context}`)
    this.debug('constructor: %o', { options })
    this.socket = opts.socket
    this.options = options

    if (options.bufferData) { this.buffer = [] }
    this.pairedSocket = undefined
    this.timeout()
    this.socket.on('data', this.onSocketData.bind(this))
    this.socket.on('close', this.onSocketClose.bind(this))
  }

  onSocketData (data) {
    this.debug('socket:onData', { bufferData: this.options.bufferData })
    if (this.options.bufferData) {
      this.buffer[this.buffer.length] = data
      this.debug('socket:onData - data', { bufferLength: this.buffer.length })
      this.authorize()
      return
    }
    try {
      this.pairedSocket.write(data)
    } catch (err) {
      this.debug('socket:onData:writeError', err)
    }
  }

  onSocketClose (hadError) {
    this.debug('socket:onClose', { hadError, pairedSocket: !!this.pairedSocket })
    if (this.pairedSocket !== undefined) {
      this.pairedSocket.destroy()
    }
    this.emit('close')
  }

  timeout () {
    this.debug('timeout', { timeout: this.options.timeout })
    if (!this.options.timeout) {
      return
    }
    setTimeout(() => {
      this.debug('timeout:setTimeout', { bufferData: !!this.options.bufferData })
      if (this.options.bufferData) {
        this.socket.destroy()
        this.emit('close')
      }
    }, this.options.timeout)
  }

  authorize () {
    this.debug('authorize', { secret: this.options.secret })
    if (!this.options.secret) { return }

    const keyLen = this.options.secret.length
    const isSame = (this.buffer[0].length >= keyLen &&
      this.buffer[0].toString(undefined, 0, keyLen) ===
      this.options.secret)

    if (isSame) {
      this.debug('authorize - authorized')
      this.buffer[0] = this.buffer[0].slice(keyLen)
      this.emit('authorized')
    } else {
      this.debug('authorize - denied')
      this.socket.destroy()
    }
  }

  writeBuffer () {
    this.debug('writeBuffer')
    if (this.options.bufferData && this.buffer.length > 0) {
      try {
        for (let i = 0; i < this.buffer.length; i++) {
          this.pairedSocket.write(this.buffer[i])
        }
      } catch (ex) {
      }
      this.buffer.length = 0
    }
    this.options.bufferData = false
  }
}

module.exports = { Client }
