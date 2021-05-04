class SimulatorDeviceId {
  constructor(simulatorUDID, metaInfo) {
    this.udid = simulatorUDID;
    this._metaInfo = metaInfo;
  }

  get id() {
    return this.udid;
  }

  toString() {
    return `${this.udid} ${this._metaInfo}`; // TODO replace metaInfo with explicit device type?
  }
}

module.exports = SimulatorDeviceId;
