import dorita980 from 'dorita980';
import dgram from 'dgram';
const sleep = milliseconds => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);

export class roombaController {
  private connected = false;
  public roomba;
  constructor(
    public readonly host: string,
    public readonly blid: string,
    public readonly password: string,
    public readonly keepAlive: boolean,
  ) {
    /*if (host !== null && blid !== null && password !== null) {
      throw Error('No Host/Blid/Password supplied');
    }
    */
    this.connected = false;
  }

  connect() {
    if (this.keepAlive) {
      if (this.roomba === null) {
        this.roomba = new dorita980.Local(this.blid, this.password, this.host);
        return this.roomba;
      } else {
        return this.roomba;
      }
    } else {
      this.roomba = new dorita980.Local(this.blid, this.password, this.host);
      return this.roomba;
    }
  }

  endRoombaIfNeeded() {
    if (!this.keepAlive) {
      this.roomba.end();
      this.connected = false;
    }
  }

  waitForConnection() {
    if (this.connected === false) {
      this.connect();
      this.roomba.on('connect', () => {
        this.connected = true;
        return;
      });
    } else {
      return;
    }
    while (this.connected === false) {
      sleep(100);
    }
  }

  getState() {
    this.waitForConnection();
    return this.roomba.getRobotState([
      'batPct',
      'mac',
      'bin',
      'softwareVer',
      'lastCommand',
      'name',
      'cleanMissionStatus',
      'carpetBoost',
      'vacHigh',
      'noAutoPasses',
      'twoPass',
    ]).then((state) => {
      this.endRoombaIfNeeded();
      return JSON.parse(state);
    });
  }





  getRunningState() {
    return this.getState().cleanMissionStatus.cycle;
  }

  getCarpetBoost() {
    const carpetBoost = this.getState().carpetBoost;
    const vacHigh = this.getState().vacHigh;
    if (carpetBoost && !vacHigh) {
      return 'Auto';
    } else if (!carpetBoost && vacHigh) {
      return 'Performance';
    } else if (!carpetBoost && !vacHigh) {
      return 'Eco';
    }
  }

  async setCarpetBoost(Mode: 'Auto' | 'Performance' | 'Eco') {
    this.waitForConnection();
    switch (Mode) {
      case 'Auto':
        this.roomba.setCarpetBoostAuto();
        break;
      case 'Performance':
        this.roomba.setCarpetBoostPerformance();
        break;
      case 'Eco':
        this.roomba.setCarpetBoostEco();
        break;
    }
  }

  getCleaningPasses() {
    const noAutoPasses = this.getState().noAutoPasses;
    const twoPass = this.getState().twoPass;
    if (!noAutoPasses && !twoPass) {
      return 'Auto';
    } else if (noAutoPasses && twoPass) {
      return 'Performance';
    } else if (noAutoPasses && !twoPass) {
      return 'Eco';
    }
  }

  getBinfull() {
    return this.getState().bin.full;
  }

  getBatPct() {
    return this.getState().batPct;
  }

  getBatCharging() {
    return this.getState().cleanMissionStatus.phase === 'charge' ? true : false;
  }



  async start(room?) {
    this.waitForConnection();
    if (room !== null) {
      await this.roomba.cleanRoom(room);
    } else {
      await this.roomba.start();
    }
  }




  async stop(dock?: boolean) {
    this.waitForConnection();
    await this.roomba.pause();
    if (dock === true) {
      await this.roomba.dock();
    }
    this.endRoombaIfNeeded();
  }

  async identify() {
    this.waitForConnection();
    await this.roomba.find();
    this.endRoombaIfNeeded();
  }
}


export class cacher {
  public cache = {};
  get(key: string) {
    return this.cache[key];
  }

  set(key: string, value?) {
    this.cache[key] = value;
  }

  dump() {
    return JSON.stringify(this.cache, null, 2);
  }

  delete(key: string) {
    delete this.cache[key];
  }
}
export class discovery {
  getRobotIp(blid, callback) {
    const server = dgram.createSocket('udp4');
    server.on('error', (err) => {
      server.close();
      throw Error(err.toString());
    });

    server.on('message', (msg) => {
      try {
        const parsedMsg = JSON.parse(msg.toString());
        if (parsedMsg.hostname && parsedMsg.ip &&
                    ((parsedMsg.hostname.split('-')[0] === 'Roomba') ||
                        (parsedMsg.hostname.split('-')[0] === 'iRobot'))) {
          if (parsedMsg.hostname.split('-')[1] === blid) {
            server.close();
            // eslint-disable-next-line no-console
            console.log(parsedMsg);
            callback(parsedMsg.ip);
            //cb(null, parsedMsg.ip);
          }
        }
      } catch (err) {
        server.close();
      }
    });

    server.on('listening', () => {
      // eslint-disable-next-line no-console
      console.log('Looking for robots...');
    });

    server.bind(5678, () => {
      const message = Buffer.from('irobotmcs');
      server.setBroadcast(true);
      server.send(message, 0, message.length, 5678, '255.255.255.255');
    });
  }

  getAvailableRobots(){
    const server = dgram.createSocket('udp4');
    let robots;
    server.on('error', (err) => {
      server.close();
      throw Error(err.toString());
    });

    server.on('message', (msg) => {
      try {
        const parsedMsg = JSON.parse(msg.toString());
        if (parsedMsg.hostname && parsedMsg.ip &&
                    ((parsedMsg.hostname.split('-')[0] === 'Roomba') ||
                        (parsedMsg.hostname.split('-')[0] === 'iRobot'))) {
          robots.push({
            'blid': parsedMsg.hostname.split('-')[1],
            'ip': parsedMsg.ip,
          });
        }
      } catch (err) {
        server.close();
      }
    });

    server.on('listening', () => {
      setTimeout(() => {
        return robots;
      }, 5000);
    });

    server.bind(5678, () => {
      const message = Buffer.from('irobotmcs');
      server.setBroadcast(true);
      //server.send('hi', 0, 2, 5678, '255.255.255.255');
      server.send(message, 0, message.length, 5678, '255.255.255.255');
    });
  }
}