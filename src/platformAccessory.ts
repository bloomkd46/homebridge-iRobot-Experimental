import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { iRobotPlatform } from './platform';
import { roombaController, cacher } from './roombaController';
const cache = new cacher();
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iRobotPlatformAccessory {
  private purifierService: Service;
  private filterService: Service;
  private batteryService: Service;
  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */


  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
  // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, /*this.platform.config.model ||*/ 'Roomba')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, /*accessory.context.device.blid ||*/ 'Undefined')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, /*this.roomba.getState().softwareVer ||*/ 'Undefined')
      // set the service name, this is what is displayed as the default name on the Home app
      // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
      .setCharacteristic(this.platform.Characteristic.Name, accessory.displayName || 'Roomba');
    //.setCharacteristic(this.platform.Characteristic.Identify, true);
    //.setCharacteristic(this.platform.Characteristic.AppMatchingIdentifier, 'iRobot');

    // get the purifier service if it exists, otherwise create a new purifier service
    // you can create multiple services for each accessory
    this.purifierService = this.accessory.getService(this.platform.Service.AirPurifier) ||
      this.accessory.addService(this.platform.Service.AirPurifier);

    this.filterService = this.accessory.getService(this.platform.Service.FilterMaintenance) ||
      this.accessory.addService(this.platform.Service.FilterMaintenance);

    this.batteryService = this.accessory.getService(this.platform.Service.Battery) ||
      this.accessory.addService(this.platform.Service.Battery);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // register handlers for the On/Off Characteristics
    /*this.service.getCharacteristic(this.platform.Characteristic.Identify)
      .onSet(this.identify.bind(this));
      */
    this.purifierService.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
      .onGet(this.getMode.bind(this));
    this.purifierService.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));
    this.purifierService.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
      .onSet(this.setTarget.bind(this))
      .onGet(this.getTarget.bind(this));
    this.purifierService.getCharacteristic(this.platform.Characteristic.RotationSpeed)
      .onSet(this.setPower.bind(this))
      .onGet(this.getPower.bind(this));

    this.filterService.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
      .onGet(this.getBinfull.bind(this));

    this.batteryService.getCharacteristic(this.platform.Characteristic.StatusLowBattery)
      .onGet(this.getBatteryLow.bind(this));
    this.batteryService.getCharacteristic(this.platform.Characteristic.BatteryLevel)
      .onGet(this.getBatteryPct.bind(this));
    this.batteryService.getCharacteristic(this.platform.Characteristic.ChargingState)
      .onGet(this.getCharging.bind(this));


    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */

    // Example: add two "motion sensor" services to the accessory
    /*const binFullService = this.accessory.getService('Motion Sensor One Name') ||
      this.accessory.addService(this.platform.Service.FilterMaintenance, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');
*/
    /*const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name') ||
      this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');
*/
    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
  }

  private roomba = new roombaController(
    this.accessory.context.device.ip,
    this.accessory.context.device.blid,
    this.accessory.context.device.password,
    this.accessory.context.device.keepAlive || false
  );


  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async identify() {
    this.roomba.identify();
  }

  async setActive(value: CharacteristicValue) {
    if (value === this.platform.Characteristic.Active.ACTIVE) {
      this.roomba.start();
    } else {
      this.roomba.stop(this.accessory.context.device.dockOnStop || true);
    }
    this.platform.log.debug('Set roomba to ->', value);
    this.updateRoomba('Active');
  }

  async setTarget(value: CharacteristicValue) {
    if (value === this.platform.Characteristic.TargetAirPurifierState.AUTO) {
      this.roomba.setCarpetBoost('Auto');
    } else {
      this.roomba.setCarpetBoost(cache.get('Power') < 50 ? 'Eco' : 'Performance');
    }
    this.platform.log.debug('Setting targetState to: ' + value);
    this.updateRoomba('Target');
  }

  async setPower(value: CharacteristicValue) {
    if (value !== 50) {
      this.roomba.setCarpetBoost(value < 50 ? 'Eco' : 'Performance');
      this.platform.log.debug('Setting Power to: ' + (value < 50 ? 'Eco' : 'Performance'));
      this.updateRoomba('Power');
    } else {
      this.roomba.setCarpetBoost('Auto');
      this.platform.log.debug('Setting Power to: Auto');
      this.updateRoomba('Target');
      this.updateRoomba('Power');
    }
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getActive(): Promise<CharacteristicValue> {
    this.updateRoomba('Active');
    this.platform.log.debug('Updating Roomba State From Cache To ->', cache.get('Active') || 'INACTIVE');
    return this.platform.Characteristic.Active[cache.get('Active') || 'INACTIVE'];
    //return cache.get('Active');
  }

  async getMode(): Promise<CharacteristicValue> {
    this.updateRoomba('Mode');
    this.platform.log.debug('Updating Roomba Mode From Cache To ->', cache.get('Mode') || 'IDLE');
    return this.platform.Characteristic.CurrentAirPurifierState[cache.get('Mode') || 'IDLE'];
  }

  async getTarget(): Promise<CharacteristicValue> {
    this.updateRoomba('Target');
    this.platform.log.debug('Updating Roomba Carpet Boost From Cache To ->', cache.get('Target') || 'AUTO');
    return this.platform.Characteristic.TargetAirPurifierState[cache.get('Target') || 'AUTO'];
  }

  async getBinfull(): Promise<CharacteristicValue> {
    this.updateRoomba('Binfull');
    this.platform.log.debug('Updating Roomba Bin Full From Cache To ->', cache.get('Binfull') || 'FILTER_OK');
    return this.platform.Characteristic.FilterChangeIndication[cache.get('Binfull') || 'FILTER_OK'];
  }

  async getCharging(): Promise<CharacteristicValue> {
    this.updateRoomba('BatteryCharging');
    this.platform.log.debug('Updating Roomba Charging State From Cache To ->', cache.get('BatteryCharging') || 'NOT_CHARGING');
    return this.platform.Characteristic.ChargingState[cache.get('BatteryCharging') || 'NOT_CHARGING'];
  }

  async getBatteryLow(): Promise<CharacteristicValue> {
    this.updateRoomba('BatteryLow');
    this.platform.log.debug('Updating Roomba Battery State From Cache To ->', cache.get('BatteryLow') || 'BATTERY_LEVEL_NORMAL');
    return this.platform.Characteristic.StatusLowBattery[cache.get('BatteryLow') || 'BATTERY_LEVEL_NORMAL'];
  }

  async getBatteryPct(): Promise<CharacteristicValue> {
    this.updateRoomba('BatteryPct');
    this.platform.log.debug('Updating Roomba Battery From Cache To ->', cache.get('BatteryPct') || 50 + '%');
    return this.platform.Characteristic.BatteryLevel[cache.get('BatteryPct') || 50];
  }

  async getPower(): Promise<CharacteristicValue> {
    this.updateRoomba('Power');
    this.platform.log.debug('Updating Roomba Cleaning Power From Cache To ->', cache.get('Power') || 0 + '%');
    return this.platform.Characteristic.RotationSpeed[cache.get('Power') || 50];
  }



  async watch(Interval: number){
    // eslint-disable-next-line no-constant-condition
    while (true){
      setInterval(() => {
        this.updateRoomba();
      }, Interval);
    }
  }

  // eslint-disable-next-line max-len
  async updateRoomba(characteristic?: 'Active' | 'Mode' | 'Target' | 'Binfull' | 'BatteryPct' | 'BatteryCharging' | 'BatteryLow' | 'Power') {
    let status;
    switch (characteristic) {
      case 'Active':
        switch (this.roomba.getRunningState()) {
          case 'none':
            status = 'INACTIVE';
            break;
          default:
            status = 'ACTIVE';
            //throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          // if you need to return an error to show the device as "Not Responding" in the Home app:
          // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
        this.platform.log.debug('Updating Roomba State To ->', status);
        cache.set('Active', status);
        this.purifierService.updateCharacteristic(
          this.platform.Characteristic.CurrentAirPurifierState,
          this.platform.Characteristic.CurrentAirPurifierState[status],
        );
        break;
      case 'Mode':
        switch (this.roomba.getRunningState()) {
          case 'none':
            status = 'INACTIVE';
            break;
          case 'running':
            status = 'PURIFYING_AIR';
            break;
          /*case 'charging':
            status = 'IDLE';
            break;
          default:
            status = 'UNKNOWN';
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          // if you need to return an error to show the device as "Not Responding" in the Home app:
          // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          */
          default:
            status = 'IDLE';
            break;
        }
        this.platform.log.debug('Updating Roomba Mode To ->', status);
        cache.set('Mode', status);
        this.purifierService.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState,
          this.platform.Characteristic.CurrentAirPurifierState[status],
        );
        break;
      case 'Target':
        switch (this.roomba.getCarpetBoost()) {
          case 'Auto':
            status = 'AUTO';
            break;
          case 'Performance':
            status = 'MANUAL';
            break;
          case 'Eco':
            status = 'MANUAL';
            break;
          default:
            status = 'AUTO';
          //throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
        this.platform.log.debug('Updating Roomba Cleaning Power To ->', status);

        cache.set('Target', status);
        this.purifierService.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState,
          this.platform.Characteristic.TargetAirPurifierState[status],
        );
        break;
      case 'Power':
        switch (this.roomba.getCarpetBoost()) {
          case 'Eco':
            status = 25;
            break;
          case 'Performance':
            status = 75;
            break;
          case 'Auto':
            status = 50;
            break;
        }
        this.platform.log.debug('Updating Roomba Cleaning Power To ->', status + '%%');

        cache.set('Power', status);
        this.purifierService.updateCharacteristic(this.platform.Characteristic.RotationSpeed,
          this.platform.Characteristic.RotationSpeed[status],
        );
        break;
      case 'Binfull':
        status = this.roomba.getBinfull() ? 'CHANGE_FILTER' : 'FILTER_OK';
        /*if (roomba.getBinfull()){
          status = true;
        } else{
          status = false;
        }
        */
        this.platform.log.debug('Updating Roomba Binfull To ->', status);

        cache.set('Binfull', status);
        this.filterService.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication,
          this.platform.Characteristic.FilterChangeIndication[status],
        );
        break;
      case 'BatteryPct':
        status = this.roomba.getBatPct();
        this.platform.log.debug('Updating Roomba Battery To ->%%', status);

        cache.set('BatteryPct', status);
        this.batteryService.updateCharacteristic(this.platform.Characteristic.BatteryLevel,
          this.platform.Characteristic.BatteryLevel[status],
        );
        break;
      case 'BatteryCharging':
        status = this.roomba.getBatCharging() ? 'CHARGING' : 'NOT_CHARGING';
        this.platform.log.debug('Updating Roomba Battery To ->', status);

        cache.set('BatteryCharging', status);
        this.batteryService.updateCharacteristic(this.platform.Characteristic.ChargingState,
          this.platform.Characteristic.ChargingState[status],
        );
        break;
      case 'BatteryLow':
        status = (cache.get('BatteryPct') < 20) ? 'BATTERY_LEVEL_LOW' : 'BATTERY_LEVEL_NORMAL';
        this.platform.log.debug('Updating Roomba Battery To ->', status);

        cache.set('BatteryLow', status);
        this.batteryService.updateCharacteristic(this.platform.Characteristic.StatusLowBattery,
          this.platform.Characteristic.StatusLowBattery[status],
        );
        break;
      default:
        this.updateRoomba('Active');
        this.updateRoomba('Mode');
        this.updateRoomba('Target');
        this.updateRoomba('Binfull');
        this.updateRoomba('BatteryPct');
        this.updateRoomba('BatteryCharging');
        this.updateRoomba('BatteryLow');
        this.updateRoomba('Power');
    }
  }
}
