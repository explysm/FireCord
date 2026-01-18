# FireCord

Bundle based on Kettu/ShiggyCord, made just for fun

### Have any questions? You can reach us at [discord.gg/nFUSEgtkQj](https://discord.gg/nFUSEgtkQj)


## Installing

### Android

#### No root
> Download and install Fire Manager from [explysm/FireManager](https://github.com/explysm/firemanager)
> Click "Install" and watch the flames arise. 
> (We highly suggest using version ```305012``` or ```306013``` by going to Fire Manager > settings > other > custom version, as these two versions are the most compatible with themes/plugins while still being some-what new.)

#### Root
> Note:
> You must have an lsposed loader module for your root type. 
> Download and install the FireXposed lsposed module from [explysm/FireXposed](https://github.com/explysm/firexposed), after that, restart your phone and FireCord will be installed in offical Discord.

### Android/iOS
- **Injecting bundle:**
  ```url
  https://github.com/explysm/FireCord/releases/latest/download/firecord.js
  ```

## Building
1. Install a FireCord loader with loader config support (any mentioned in the [Installing](#installing) section).
1. Go to Settings > General and enable Developer Settings.
1. Clone the repo:
    ```
    git clone https://github.com/explysm/FireCord.git
    ```
1. Install dependencies:
    ```
    bun i
    ```
1. Build FireCord's code:
    ```
    bun run build
    ```
1. In the newly created `dist` directory, run a HTTP server. I recommend [http-server](https://www.npmjs.com/package/http-server).
1. Go to Settings > Developer enabled earlier. Enable `Load from custom url` and input the IP address and port of the server (e.g. `http://192.168.1.236:4040/firecord.js`) in the new input box labelled `FireCord URL`.
1. Restart Discord. Upon reload, you should notice that your device will download FireCord's bundled code from your server, rather than GitHub.
1. Make your changes, rebuild, reload, go wild!

Alternatively, you can directly *serve* the bundled code by running `bun run serve`. `firecord.js` will be served on your local address under the port 4040. You will then insert `http://<local ip address>:4040/firecord.js` as a custom url and reload. Whenever you restart your mobile client, the script will rebuild the bundle as your client fetches it.
