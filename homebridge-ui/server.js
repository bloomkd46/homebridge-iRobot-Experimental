/* jshint node: true, esversion: 10, -W014, -W033 */
/* eslint-disable new-cap */
'use strict'

const { HomebridgePluginUiServer } = require('@homebridge/plugin-ui-utils')
const fs = require('fs')

class PluginUiServer extends HomebridgePluginUiServer {
  constructor () {
    super()

    /*
      A native method getCachedAccessories() was introduced in config-ui-x v4.37.0
      The following is for users who have a lower version of config-ui-x
    */
    this.onRequest('/getCachedAccessories', async () => {
      try {
        // Define the plugin and create the array to return
        const plugin = 'homebridge-irobot'
        const devicesToReturn = []

        // The path and file of the cached accessories
        const accFile = this.homebridgeStoragePath + '/accessories/cachedAccessories'

        // Check the file exists
        if (fs.existsSync(accFile)) {
          // Read the cached accessories file
          let cachedAccessories = await fs.promises.readFile(accFile)

          // Parse the JSON
          cachedAccessories = JSON.parse(cachedAccessories)

          // We only want the accessories for this plugin
          cachedAccessories
            .filter(accessory => accessory.plugin === plugin)
            .forEach(accessory => devicesToReturn.push(accessory))
        }

        // Return the array
        return devicesToReturn
      } catch (err) {
        // Just return an empty accessory list in case of any errors
        return []
      }
    })
    this.onRequest('/getRoombaPassword', async (host) => {
      var sliceFrom = 13;
  const packet = 'f005efcc3b2900';
  var client = tls.connect(8883, host, {timeout: 10000, rejectUnauthorized: false, ciphers: process.env.ROBOT_CIPHERS || 'AES128-SHA256'}, function () {
    client.write(new Buffer(packet, 'hex'));
  });

  client.on('data', function (data) {
    if (data.length === 2) {
      sliceFrom = 9;
      return;
    }
    if (data.length <= 7) {
      throw new RequestError('Error getting password. Follow the instructions and try again.');
//      console.log('Error getting password. Follow the instructions and try again.');
    } else {
      return new Buffer(data).slice(sliceFrom).toString();
      //console.log('Password=> ' + new Buffer(data).slice(sliceFrom).toString() + ' <= Yes, all this string.');
      //console.log('Use this credentials in dorita980 lib :)');
    }
    client.end();
    process.exit(0);
  });

  client.setEncoding('utf-8');
    })
    this.ready()
  }
}

;(() => new PluginUiServer())()