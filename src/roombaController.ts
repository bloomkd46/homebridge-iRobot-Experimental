import dorita980 from 'dorita980';
import { Logger } from 'homebridge';
let roomba;
var keepAlive = false;

export class roombaController {
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
        roomba = new dorita980.Local(blid, password, host);
        return roomba;
      } else {
        return roomba;
      }
    } else {
      roomba = new dorita980.Local(blid, password, host);
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
        'twoPass'
      ]).then((state) => {
        if (!keepAlive) roomba.end();
        return state;
      });
  }

  getRunningState() {
    return this.getState().cleanMissionStatus.cycle;
  }

  getCarpetBoost() {
    let carpetBoost = await this.getState().carpetBoost
    let vacHigh = await this.getState().vacHigh
    if (carpetBoost && !vacHigh) {
      return 'Auto';
    } else if (!carpetBoost && vacHigh) {
      return 'Performance';
    } else if (!carpetBoost && !vacHigh) {
      return 'Eco';
    }
  }
  getCleaningPasses() {
    let noAutoPasses = await this.getState().noAutoPasses
    let twoPass = await this.getState().twoPass
    if (!noAutoPasses && !twoPass) {
      return 'Auto'
    } else if (noAutoPasses && twoPass) {
      return 'Performance'
    } else if (noAutoPasses && !twoPass) {
      return 'Eco'
    }
  }

  start(room?) {
    await this.connect();
    if (room !== null) {
      await roomba.cleanRoom(room);
    } else {
      await roomba.start();
    }
    if (!keepAlive) roomba.end();
  }

  stop(dock?: boolean) {
    await this.connect();
    await roomba.pause();
    if (dock === true) {
      await roomba.dock();
    }
    if (!keepAlive) roomba.end();
  }

  identify() {
    this.connect();
    roomba.find();
    if (!keepAlive) roomba.end();
  }
}