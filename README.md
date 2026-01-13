# FireCord

Bundle based on Kettu/FireCord, made just for fun

## Installing

### Android
FireCord currently **does not** have a dedicated manager. To use FireCord, follow the instructions below:

Get FireCord manager: 

[FireCord Manager](https://github.com/kmmiio99o/ShiggyManager)

Install v305012/306013 by clicking "new install" and setting the version channel to "custom." It's also recommended to change the package name to ```dev.fire.cord``` & changing the app name to "FireCord."

After installation, open up FireCord and shake your phone to make the FireCord Recovery appear. 

Next, click "Load Custom Bundle" and enable Custom Url. Input the following:
```https://github.com/explysm/FireCord/releases/latest/download/firecord.js```

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