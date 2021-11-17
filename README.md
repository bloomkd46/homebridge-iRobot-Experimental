<p align="center">
 <a href="https://github.com/bwp91/homebridge-meross"><img alt="Homebridge Verified" src="https://user-images.githubusercontent.com/43026681/127397024-8b15fc07-f31b-44bd-89e3-51d738d2609a.png" width="600px"></a>
</p>
<span align="center">

# homebridge-iRobot

Homebridge plugin to integrate iRobot roombas into HomeKit

[![verified-by-homebridge](https://badgen.net/badge/homebridge/pending/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![hoobs-certified](https://badgen.net/badge/HOOBS/pending/yellow)](https://plugins.hoobs.org/plugin/homebridge-meross)  
[![npm](https://img.shields.io/npm/v/homebridge-irobot/latest?label=latest)](https://www.npmjs.com/package/homebridge-irobot)
[![npm](https://img.shields.io/npm/v/homebridge-irobot/beta?label=beta)](https://github.com/bwp91/homebridge-irobot/wiki/Beta-Version)  
[![npm](https://img.shields.io/npm/dt/homebridge-irobot)](https://www.npmjs.com/package/homebridge-irobot)


</span>

### Plugin Information

- This plugin allows you to view and control your iRobot roombas within HomeKit. The plugin:
  - downloads a device list if your iRobot credentials are supplied
  - attempts to control your devices locally, reverting to cloud control if necessary
  - listens for real-time device updates when controlled externally
  - can ignore any roombas you have using the configuration

### Prerequisites

- To use this plugin, you will need to already have [Homebridge](https://homebridge.io) (at least v1.3.5) or [HOOBS](https://hoobs.org) (at least v4) installed. Refer to the links for more information and installation instructions.
- Whilst it is recommended to use [Node](https://nodejs.org/en/) v16, the plugin supports v12 and v14 as per the [Homebridge guidelines](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js).

### Setup

- [Installation](../../wiki/Installation)
- [Configuration](../../wiki/Configuration)
- [Beta Version](../../wiki/Beta-Version)
- [Node Version](../../wiki/Node-Version)
- [Uninstallation](../../wiki/Uninstallation)

### Help/About

- [Common Errors](../../wiki/Common-Errors)
- [Support Request](../../issues/new/choose)
- [Changelog](/CHANGELOG.md)

### Credits

- To [Homebridge-Roomba2](https://github.com/karlvr/homebridge-roomba2) who inspired me to start this plugin.
- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.

### Disclaimer

- I am in no way affiliated with iRobot and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.