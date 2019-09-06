# ✨  hypertunnel [![Build Status](https://travis-ci.org/berstend/hypertunnel.svg?branch=master)](https://travis-ci.org/berstend/hypertunnel) [![ ](https://img.shields.io/uptimerobot/status/m780555855-0760af5af94854abdcb02c82.svg)](https://stats.uptimerobot.com/PzXg8inWK) [![ ](https://img.shields.io/uptimerobot/ratio/m778918918-3e92c097147760ee39d02d36.svg)](https://stats.uptimerobot.com/PzXg8inWK) [![](https://packagephobia.now.sh/badge?p=hypertunnel)](https://packagephobia.now.sh/result?p=hypertunnel) [![ ](https://img.shields.io/npm/v/hypertunnel.svg)](https://www.npmjs.com/package/hypertunnel)

<a href="https://github.com/berstend/hypertunnel"><img src="https://i.stack.imgur.com/MN8RF.gif" width="280px" height="230px" align="right" /></a>


> When localtunnel/ngrok is not enough.

This free TCP relay/reverse proxy service can be used to **expose any TCP/IP service** running behind a NAT. It's using [hypertunnel-tcp-relay](/packages/hypertunnel-tcp-relay) under the hood, which itself is based on the excellent [node-tcp-relay](https://github.com/tewarid/node-tcp-relay) from [tewarid](https://github.com/tewarid), adding self-service multi-client support similar to localtunnel, a cool project name with "hyper" in it and **a free public server**.



## Installation
```bash
# Use directly with no installation (npx is part of npm):
❯❯❯ npx hypertunnel --port 8080

# Or install globally:
❯❯❯ npm install -g hypertunnel
```

## Usage
```bash
❯❯❯ hypertunnel --help

  Usage: hypertunnel --port 8080 [options]

  Expose any local TCP/IP service on the internet.

  Options:

    -v, --version                output the version number
    -p, --port [port]            local TCP/IP service port to tunnel
    -l, --localhost [localhost]  local server (default: localhost)
    -s, --server [server]        hypertunnel server to use (default: https://hypertunnel.ga)
    -t, --token [token]          token required by the server (default: free-server-please-be-nice)
    -i, --internet-port [port]   the desired internet port on the public server
    -r, --relay-port [port]      the desired relay port on the public server
    --ssl                        enable SSL termination (https://) on the public server
    -h, --help                   output usage information
```

## Examples <sup><sub><var>(click to expand)</var></sub></sup>


---

<details>
 <summary><strong><code>Example</code> Local webserver</strong></summary>

### Example: Local webserver

Run a static web server in your current directory:

```bash
❯❯❯ npx http-server -p 7777
```

In another terminal window create a hypertunnel to make that server accessible from the internet:

```bash
❯❯❯ npx hypertunnel -p 7777
```

Et voila:

```bash
  ✨ Hypertunnel created.

  Tunneling hypertunnel.ga:19432 > localhost:7777
```

#### Bonus: Free SSL termination (https://)

Run hypertunnel with the `--ssl` flag, to let it know you wish for https support (with a valid certificate):

```bash
❯❯❯ npx hypertunnel@latest -p 7777 --ssl
```
```bash
  ✨ Hypertunnel created.

  Tunneling https://hypertunnel.ga:26949 > localhost:7777
```

SSL is not enabled by default as it makes mostly sense for HTTP servers, which is not the sole use-case for hypertunnel. :-)


#### Tip: Run commands in parallel

You can use bash niceties to run mutiple commands in parallel and stop all of them when hitting `ctrl+c`:

```bash
❯❯❯ (npx http-server -p 7777 & npx hypertunnel --port 7777 --ssl)
```


</details>

---

<details>
 <summary><strong><code>Example</code> Remote SSH login</strong></summary>

### Example: Remote SSH login

As hypertunnel is a generic TCP/IP relay, why not use it for something different than a webserver.

Say you're running MacOS or Linux on your workstation and you want to quickly ssh into it from anywhere.

> Note: Make sure your local SSH daemon is running ([macOS instructions](https://support.apple.com/kb/PH25252?locale=en_US)).

```bash
# Create a tunnel for the local SSH service running on port 22
❯❯❯ npx hypertunnel --port 22
```

Use the hypertunnel to SSH into that machine, from anywhere:

```bash
# Example, adjust the port based on the previous output:
❯❯❯ ssh hypertunnel.ga -p 21357
```
```bash
Warning: Permanently added 'hypertunnel.ga:21357' (ECDSA) to the list of known hosts.
Password:
```

</details>

---

<details>
 <summary><strong><code>Example</code> Run and expose a local telnet chat server</strong></summary>

### Example: Run and expose a local telnet chat server

```bash
❯❯❯ npx netchat server -p 3000
```

In another terminal:

```bash
❯❯❯ npx hypertunnel -p 3000
```

From anywhere:

```bash
❯❯❯ telnet hypertunnel.ga 31967
```
```bash
Trying 159.69.23.189...
Connected to hypertunnel.ga.
Escape character is '^]'.
bob
Welcome, ::ffff:127.0.0.1:56252
Type "quit" to exit.

Enter username: You are now bob
> hello world
> _
```

</details>

---



## Comparison to localtunnel/ngrok

Both are great services!
If your use-case is to simply tunnel local http web server traffic I suggest using them. :-)

I ran into issues when trying to expose a local proxy server (to use the client as forwarding proxy). Both services need to inspect and rewrite HTTP headers for routing, so using the tunnel as a proxy in e.g. Chrome won't work. There are a couple other use-cases where raw TCP stream tunnelling is desired and hypertunnel is the only available option.

**Technical differences**

Instead of using hostnames to direct traffic to clients, hypertunnel is using **a dedicated public port per tunnel**. This greatly simplifies things as TCP/IP traffic can be routed based on the assigned port, without http header inspection and rewriting.


## Free server: hypertunnel.ga

I really like the simplicity of services like [localtunnel](https://github.com/localtunnel/localtunnel) & [ngrok](https://ngrok.com/) as they're **generously offering a free server**.
I'm doing the same for hypertunnel but beware of using this free server in mission critical settings.
If you'd like to offer sponsorship for the public server feel cheered at and please raise a ticket. :-)

PS: You can also self-host a private [hypertunnel-server](/packages/hypertunnel-server) and point the [client](/packages/hypertunnel) to it.

**Limits**

There are currently no enforced usage limits, in the hopes that you will use the server in good faith.
Tunnels are destroyed when you exit the client and latest after 24 hours of creation.



## Status

It's doing what it says on the tin. Certain things could be improved and battle-hardened. It works for my current use-case so please raise an issue if you encounter problems.

The CLI interface is stable, but programmatic usage comes with no warranty as internals might change in the future (the internals are also not properly documented currently).

Have a look at the [tests](/test/) to get an idea of how to use hypertunnel programmatically.

Given that there is no alternative to hypertunnel I figured I'd rather release it early. :-)


## Contributing

Contributions are welcome.

We use a [monorepo](https://github.com/berstend/hypertunnel) powered by [Lerna](https://github.com/lerna/lerna#--use-workspaces) (and yarn workspaces), [ava](https://github.com/avajs/ava) for testing and the [standard](https://standardjs.com/) style for linting.

<details>
 <summary><strong>Monorepo cheat sheet</strong></summary>

```bash
# Make sure you have a recent version of yarn & lerna installed:
npm install -g yarn lerna

# Bootstrap the packages in the current Lerna repo.
# Installs all of their dependencies and links any cross-dependencies.
yarn bootstrap

# Install debug in all packages
lerna add debug

# Install debug in all packages as dev dependency
lerna add --dev debug

# Install fs-extra to hypertunnel-server
lerna add fs-extra --scope=hypertunnel-server

# Remove dependency
# https://github.com/lerna/lerna/issues/833
lerna exec -- yarn remove fs-extra

# Run test in all packages
yarn test
```

</details>

### Todo

**server & client**
- Hook into `hypertunnel-tcp-relay` events for better cleanup, error reporting and to show established connections
- Support environment variables next to cli params

**client**
- Support `--basic-auth` flag as a simple way to secure a local http server
- Add `--timeout` flag, so a tunnel will self-destruct after a specified delay

**server**
- Use e.g. redis or message passing for tunnel manager data to support clustering
- Battle-hardening (e.g. rate-limits to keep bad actors out) - don't make this a necessity please ಠ_ಠ


## Related

- [localtunnel](https://github.com/localtunnel/localtunnel)
- [ngrok](https://ngrok.com/)
- [serveo](https://serveo.net/)
- [telebit.js](https://git.coolaj86.com/coolaj86/telebit.js)

## License

MIT
