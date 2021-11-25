import dorita980 from 'dorita980';
let roomba, cache;
const keepAlive = false;

export class roombaController {

  constructor(
    public readonly host?: string,
    public readonly blid?: string,
    public readonly password?: string,
    public readonly keepAlive?: boolean,
  ) {
    if (host !== null && blid !== null && password !== null) {
      throw Error('No Host/Blid/Password supplied');
    }
    roomba.connected = false;
  }


  connect() {
    if (keepAlive) {
      if (roomba === null) {
        roomba = new dorita980.Local(this.blid, this.password, this.host);
        return roomba;
      } else {
        return roomba;
      }
    } else {
      roomba = new dorita980.Local(this.blid, this.password, this.host);
      return roomba;
    }
  }

  endRoombaIfNeeded() {
    if (!keepAlive) {
      roomba.end();
      roomba.connected = false;
    }
  }

  waitForConnection() {
    if (roomba.connected === false) {
      this.connect();
      roomba.on('connect', () => {
        return;
      });
    } else {
      return;
    }
    while (roomba.connected === false) {
      setInterval(() => {
        //do nothing
      }, 100);
    }
  }

  getState() {
    if (roomba.connected === false) {
      this.connect();
      roomba.on('connect', () => {
        roomba.connected = true;
        return roomba.getRobotState([
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
      });
      while (roomba.connected === false) {
        setInterval(() => {
          //do nothing
        }, 1000);
      }
    } else {
      return roomba.getRobotState([
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
        roomba.setCarpetBoostAuto();
        break;
      case 'Performance':
        roomba.setCarpetBoostPerformance();
        break;
      case 'Eco':
        roomba.setCarpetBoostEco();
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
      await roomba.cleanRoom(room);
    } else {
      await roomba.start();
    }
  }




  async stop(dock?: boolean) {
    this.waitForConnection();
    await roomba.pause();
    if (dock === true) {
      await roomba.dock();
    }
    this.endRoombaIfNeeded();
  }

  async identify() {
    this.waitForConnection();
    await roomba.find();
    this.endRoombaIfNeeded();
  }
}


export class cacher {

  constructor(cacheLabels?) {
    cacheLabels.forEach(element => {
      this.set(element, 0);
    });
  }

  get(key: string) {
    return cache[key] || 0;
  }

  set(key: string, value?) {
    cache[key] = value;
  }

  dump() {
    return cache;
  }

  delete(key: string) {
    delete cache[key];
  }
}