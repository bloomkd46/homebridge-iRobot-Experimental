import dorita980 from 'dorita980';
const keepAlive = false;

export class roombaController {
  private connected = false;
  public roomba;
  constructor(
    public readonly host?: string,
    public readonly blid?: string,
    public readonly password?: string,
    public readonly keepAlive?: boolean,
  ) {
    if (host !== null && blid !== null && password !== null) {
      throw Error('No Host/Blid/Password supplied');
    }
    this.connected = false;
  }


  connect() {
    if (keepAlive) {
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
    if (!keepAlive) {
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
      setInterval(() => {
        //do nothing
      }, 100);
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

  getRobotIp(Blid){
    dorita980.getRobotIp((err, ip) => {
      if (err) {
        throw Error(err);
      }
      const ipArray = ip.split(',');
      ipArray.forEach(ip => {
        dorita980.getRobotPublicInfo(ip, (err, info) => {
          if (err) {
            throw Error(err);
          }
          if (info.blid === Blid) {
            return ip;
          }
        });
      });
    });
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
    return this.cache[key] || 0;
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