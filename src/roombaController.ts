import dorita980 from 'dorita980';
import { Logger } from 'homebridge';
let roomba, cache;
const keepAlive = false;

export class roombaController{
  constructor(
    public readonly log?: Logger,
    public readonly host?: string,
    public readonly blid?: string,
    public readonly password?: string,
  ) {
    if (host !== null && blid !== null && password !== null) {
      throw Error('No Host/Blid/Password supplied');
    }
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

getState() {
  this.connect();
  return roomba
    .getRobotState([
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
      if (!keepAlive) {
        roomba.end();
      }
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

getBinfull(){
  return this.getState().bin.full;
}

getBatPct(){
  return this.getState().batPct;
}

getBatCharging(){
  return this.getState().cleanMissionStatus.phase === 'charge' ? true : false;
}

  async start(room ?) {
  this.connect();
  if (room !== null) {
    await roomba.cleanRoom(room);
  } else {
    await roomba.start();
  }
  if (!keepAlive) {
    roomba.end();
  }
}

  async stop(dock ?: boolean) {
  this.connect();
  await roomba.pause();
  if (dock === true) {
    await roomba.dock();
  }
  if (!keepAlive) {
    roomba.end();
  }
}

  async identify() {
  this.connect();
  await roomba.find();
  if (!keepAlive) {
    roomba.end();
  }
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