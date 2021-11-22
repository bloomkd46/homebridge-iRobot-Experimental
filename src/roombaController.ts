import dorita980 from 'dorita980';
import { Logger } from 'homebridge';
let roomba = dorita980();

export class roombaController {
  constructor(
      public readonly log?: Logger,
        public readonly host?: string,
        public readonly blid?: string,
        public readonly password?: string,
  ){
    if (host !== null && blid !== null && password !== null){
      roomba = new dorita980.Local(blid, password, host);
    }
  }


  getState(){
    return roomba
      .getRobotState(['batPct', 'mac', 'bin', 'softwareVer', 'lastCommand', 'name', 'cleanMissionStatus', 'carpetBoost', 'vacHigh'])
      .then((state) => {
        return state;
      });
  }

  getRunningState(){
    return this.getState().cleanMissionStatus.cycle;
  }

  getCarpetBoost(){
    if (this.getState().carpetBoost && !this.getState().vacHigh){
      return 'Auto';
    } else if (!this.getState().carpetBoost && this.getState().vacHigh){
      return 'Performance';
    } else if (!this.getState().carpetBoost && !this.getState().vacHigh){
      return 'Eco';
    }
  }

  start(room?){
    if (room !== null) {
      roomba.cleanRoom(room);
    }else {
      roomba.start();
    }
    roomba.end();
  }

  stop(dock?: boolean){
    roomba.pause();
    if (dock === true){
      roomba.dock();
    }
    roomba.end();
  }

  identify(){
    roomba.find();
  }
}