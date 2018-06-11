# hypertunnel

A free TCP relay/reverse proxy service to **expose any TCP/IP service** running behind a NAT.

**Please refer to the [main hypertunnel repo](https://github.com/berstend/hypertunnel) for more details.**

## Installation
```bash
npm install -g hypertunnel
```

## Usage
```bash
hypertunnel --help                                                                           
  Usage: hypertunnel --port 8080 [options]

  Expose any local TCP/IP service on the internet.

  Options:

    -v, --version                output the version number
    -p, --port [port]            local TCP/IP service port to tunnel
    -l, --localhost [localhost]  local server (default: localhost)
    -s, --server [server]        hypertunnel server to use (default: https://api.hypertunnel.ga)
    -t, --token [token]          token required by the server (default: free-server-please-be-nice)
    -i, --internet-port [port]   the desired internet port on the public server
    -h, --help                   output usage information
```

## Debug
```
DEBUG=hypertunnel:* hypertunnel --port 8080
```
