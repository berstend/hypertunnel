# hypertunnel-server

A TCP relay/reverse proxy server to **expose any TCP/IP service** running behind a NAT.

**Please refer to the [main hypertunnel repo](https://github.com/berstend/hypertunnel#readme) for more details.**

## Installation
```bash
npm install -g hypertunnel-server
```

## Usage
```bash
hypertunnel-server --help

  Options:

    -v, --version                output the version number
    -p, --port [port]            web server port (default: 3000)
    -d, --domain [domain]        public web server domain (default: hypertunnel.lvh.me)
    -t, --token [token]          token required to be sent by clients (default: free-server-please-be-nice)
    -f, --tokenFile [tokenFile]  file with token per port required to be sent by clients (default: )
    -h, --help                   output usage information
```

In a special use-case, each port requires its own (predefined) token. In this case, you can pass a token file containing a token for each port. If the port is missing or the token is wrong, a tunnel is rejected. See token.json for file format.

## Debug
```bash
DEBUG=hypertunnel:* hypertunnel-server

# If you wish to debug the underlying tcp-relay as well:
DEBUG=hypertunnel:*,relay:* hypertunnel-server
```
