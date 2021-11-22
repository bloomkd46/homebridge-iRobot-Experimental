import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { iRobotPlatform } from './platform';
import { roombaController } from './roombaController';
let roomba = new roombaController();
let roombaActive, roombaMode, roombaTarget;
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class iRobotPlatformAccessory {
  private service: Service;
  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */

  constructor(
    private readonly platform: iRobotPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    roomba = new roombaController(
      this.platform.log,
      accessory.context.device.host,
      accessory.context.device.blid,
      accessory.context.device.password,
    );
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'iRobot')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial')
      .setCharacteristic(this.platform.Characteristic.FirmwareRevision, roomba.getState().softwareVer);

    // get the purifier service if it exists, otherwise create a new purifier service
    // you can create multiple services for each accessory
    // eslint-disable-next-line max-len
    this.service = this.accessory.getService(this.platform.Service.AirPurifier) || this.accessory.addService(this.platform.Service.AirPurifier);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // register handlers for the On/Off Characteristics
    this.service.getCharacteristic(this.platform.Characteristic.Identify)
      .onSet(this.identify.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
      .onGet(this.getMode.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setActive.bind(this))
      .onGet(this.getActive.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
      .onSet(this.setTarget.bind(this))
      .onGet(this.getTarget.bind(this));

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
    setInterval(() => {
      this.updateRoomba();
    }, this.accessory.context.device.refreshInterval || 1*6000);
  }


  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async identify() {
    roomba.identify();
  }

  async setActive(value: CharacteristicValue) {
    if (value === this.platform.Characteristic.Active.ACTIVE) {
      roomba.start();
    } else {
      roomba.stop(this.accessory.context.device.dockOnStop || true);
    }
    this.platform.log.debug('Set roomba to ->', value);
    this.updateRoomba();
  }

  async setTarget(value: CharacteristicValue) {
    this.platform.log.warn('Setting targetState to: '+ value+' Support coming soon!');
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
    this.platform.log.debug('Updating Roomba State To ->', roombaActive);
    return this.platform.Characteristic.Active[roombaActive];
  }

  async getMode(): Promise<CharacteristicValue> {
    this.updateRoomba('Mode');
    this.platform.log.debug('Updating Roomba Mode To ->', roombaMode);
    return this.platform.Characteristic.CurrentAirPurifierState[roombaMode];
  }

  async getTarget(): Promise<CharacteristicValue> {
    this.updateRoomba('Target');
    this.platform.log.debug('Updating Roomba Carpet Boost To ->', roombaTarget);
    return this.platform.Characteristic.TargetAirPurifierState[roombaTarget];
  }

  async updateRoomba(characteristic?: 'Active' | 'Mode' | 'Target') {
    let status;
    switch (characteristic) {
      case 'Active':
        switch (roomba.getRunningState()) {
          case 'none':
            status = 'INACTIVE';
            break;
          default:
            status = 'ACTIVE';
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
          // if you need to return an error to show the device as "Not Responding" in the Home app:
          // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
        this.platform.log.debug('Updating Roomba State To ->', status);
        roombaActive = status;
        this.service.updateCharacteristic(
          this.platform.Characteristic.CurrentAirPurifierState,
          this.platform.Characteristic.CurrentAirPurifierState[status],
        );
        break;
      case 'Mode':
        switch (roomba.getRunningState()) {
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
        roombaMode = status;
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentAirPurifierState,
          this.platform.Characteristic.CurrentAirPurifierState[status],
        );
        break;
      case 'Target':
        switch (roomba.getCarpetBoost()) {
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
        roombaTarget = status;
        this.service.updateCharacteristic(this.platform.Characteristic.TargetAirPurifierState,
          this.platform.Characteristic.TargetAirPurifierState[status],
        );
        break;
      default:
        this.updateRoomba('Active');
        this.updateRoomba('Mode');
        this.updateRoomba('Target');
    }

  }
}
