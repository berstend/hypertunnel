# hypertunnel-tcp-relay

Heavily based on the excellent [node-tcp-relay](https://github.com/tewarid/node-tcp-relay) from [tewarid](https://github.com/tewarid).

* Rewritten in ES6 (classes & fat arrows)
* Optimized for programmatic extensibility
  * All classes are split in separate modules, exported and can be extended
  * All listener callbacks are separated into dedicated class methods
* Removed `numConn` support in client
* Removed cli support
* Added debug logging
* Added TLSRelayServer
* Added tests


## Debug

```bash
DEBUG=relay:* yarn test
```

## License

MIT © tewarid & berstend
