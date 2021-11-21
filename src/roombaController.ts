import dorita980 from 'dorita980';
import { Logger } from 'homebridge';
let roomba;

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
    return roomba.getRobotState(['batPct', 'mac', 'bin', 'softwareVer', 'lastCommand', 'name', 'cleanMissionStatus']).then((state) => {
      return state;
    });
  }

  start(room?){
    if (room !== null) {
      roomba.cleanRoom(room);
    }else {
      roomba.start();
    }
  }

  stop(dock?: boolean){
    roomba.pause();
    if (dock === true){
      roomba.dock();
    }
  }
}