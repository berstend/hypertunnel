'use strict'

const debug = require('debug')('hypertunnel:server')

const path = require('path')
const http = require('http')
const https = require('https')
const Koa = require('koa')
const Router = require('koa-router')
const Greenlock = require('greenlock-koa')
const bodyParser = require('koa-bodyparser')

const TunnelManager = require('./TunnelManager')

const app = new Koa()
const router = new Router()

class Server {
  constructor (opts = {}) {
    this.landingPage = opts.landingPage || 'https://github.com/berstend/hypertunnel#readme'
    this.serverPort = parseInt(opts.serverPort) || 3000
    this.serverDomain = opts.serverDomain || 'hypertunnel.lvh.me'
    this.serverToken = opts.serverToken || 'free-server-please-be-nice'

    this.manager = new TunnelManager()
    this._ssl = {
      enabled: (process.env.SSL_ENABLED === 'true') || false,
      port: parseInt(process.env.SSL_PORT) || 443,
      debug: (process.env.SSL_DEBUG === 'true') || false,
      email: process.env.SSL_EMAIL,
      acme: 'https://acme-staging-v02.api.letsencrypt.org/directory',
      dir: process.env.SSL_DIR || require('os').homedir() + '/acme'
    }
    if (process.env.SSL_PRODUCTION === 'true') {
      this._ssl.acme = 'https://acme-v02.api.letsencrypt.org/directory'
    }
    this._greenlock = this._createGreenlock()
    this._server = null
    this._secureServer = null
    debug('created', opts)
  }

  generateBannerMessage (body) {
    if (this.serverToken !== 'free-server-please-be-nice') { return }
    return `
  You're using a free service, please be gentle. :-)
  Contributions welcome: ${this.landingPage}

  Hit ctrl+c to close the tunnel (maximum tunnel age is 1 day).
    `
  }

  async create () {
    // error handler
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        ctx.status = err.status || 500
        ctx.body = {
          success: false,
          message: err.message
        }
        ctx.app.emit('error', err, ctx)
      }
    })

    router.all('/', ctx => {
      ctx.redirect(this.landingPage)
      ctx.status = 302
    })

    router.get('/status', async (ctx, next) => {
      debug('/status')
      ctx.body = {
        tunnels: this.manager.tunnels.size,
        mem: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      }
    })

    router.get('/status/versions', async (ctx, next) => {
      debug('/status/versions')
      ctx.body = [require('hypertunnel-tcp-relay/package.json')]
    })

    router.get('/status/:internetPort', async (ctx, next) => {
      debug('/status', ctx.params.internetPort)
      const tunnel = this.manager.tunnels.get(parseInt(ctx.params.internetPort))
      if (!tunnel) { return ctx.throw(400, 'Tunnel not found') }
      const relay = tunnel.relay
      ctx.body = {
        internetPort: relay.internetPort,
        relayPort: relay.relayPort,
        createdAt: tunnel.createdAt
      }
    })

    // curl -d '{"internetPort":"2666", "relayPort":"2333", "serverToken": "hypertunnel-free-server-please-be-nice"}' -H "Content-Type: application/json" -X POST http://localhost:3000/create
    router.post('/create', async (ctx, next) => {
      debug('/create', ctx.request.body)
      const body = ctx.request.body
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const opts = {}
        if (body.ssl) {
          opts.ssl = true
          opts.tlsOptions = await this._getTlsOptions()
        }
        if (body.ssl && !this._ssl.enabled) {
          debug('Warning, client requested SSL but only self-signed certs available.')
        }
        const tunnel = await this.manager.newTunnel(parseInt(body.internetPort) || 0, parseInt(body.relayPort) || 0, opts)
        ctx.body = {
          success: !!tunnel.relay,
          createdAt: tunnel.createdAt,
          relayPort: tunnel.relay.relayPort,
          internetPort: tunnel.relay.internetPort,
          secret: tunnel.secret,
          uri: `${this.serverDomain}:${tunnel.relay.internetPort}`,
          expiresIn: this.manager.maxAge
        }
        if (tunnel.ssl) {
          ctx.body.uri = `https://${this.serverDomain}:${tunnel.relay.internetPort}`
        }
        ctx.body.serverBanner = this.generateBannerMessage(ctx.body)
        debug('/create - response', ctx.body)
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel creation failed`)
      }
    })

    router.post('/delete', async (ctx, next) => {
      debug('/delete', ctx.request.body)
      const body = ctx.request.body
      if (body.serverToken !== this.serverToken) {
        ctx.throw(400, `Invalid serverToken`)
      }
      try {
        const success = this.manager.remove(parseInt(body.internetPort) || 0, body.secret)
        ctx.body = {
          success: !!success,
          message: success
        }
        debug('/delete - response', ctx.body)
      } catch (err) {
        console.log(err)
        ctx.throw(400, `Tunnel deletion failed`)
      }
    })

    app.use(bodyParser())
    app.use(router.routes())
    app.use(router.allowedMethods())

    app.use(async function pageNotFound (ctx) {
      ctx.throw(404, `Not found`)
    })

    app.on('error', err => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(err)
      }
    })

    await new Promise(resolve => {
      this._server = http.createServer(
        this._greenlock.tlsOptions,
        this._greenlock.middleware(app.callback())
      ).listen(this.serverPort, () => {
        console.log('Server listening on port', this.serverPort)
        return resolve()
      })
    })
    await new Promise(resolve => {
      if (!this._ssl.enabled) { return resolve() }
      this._secureServer = https.createServer(
        this._greenlock.tlsOptions,
        this._greenlock.middleware(app.callback())
      ).listen(this._ssl.port, () => {
        console.log('Secure server listening on port', this._ssl.port)
        return resolve()
      })
    })
    return this
  }

  async _getTlsOptions () {
    if (!this._ssl.enabled) {
      debug('Note: Using self-signed certs.')
      const certfolder = path.join(__dirname, 'self-signed-certs')
      return {
        key: path.join(certfolder, 'server-key.pem'),
        cert: path.join(certfolder, 'server-crt.pem'),
        ca: path.join(certfolder, 'ca-crt.pem')
      }
    }
    const configDir = this._greenlock._storeOpts.configDir
    const hostname = this.serverDomain
    const makePathAbsolute = (p) => p.replace(':configDir', configDir).replace(':hostname', hostname)
    const tlsOptions = {
      key: makePathAbsolute(this._greenlock.privkeyPath),
      cert: makePathAbsolute(this._greenlock.certPath),
      ca: makePathAbsolute(this._greenlock.fullchainPath)
    }
    return tlsOptions
  }

  _createGreenlock () {
    return Greenlock.create({
      version: 'draft-11', // Let's Encrypt v2
      server: this._ssl.acme,
      email: this._ssl.email,
      agreeTos: true,
      approveDomains: [ this.serverDomain ],
      communityMember: false,
      configDir: this._ssl.dir,
      debug: this._ssl.debug
    })
  }

  close () {
    this.manager.removeAll()
    this._server.close()
    debug('closed')
  }
}

module.exports = Server
