module.exports = class BME280 {
    constructor(options) {
        let opts = options || {};

        this.device = {};
        this.device.name = (opts.hasOwnProperty('name')) ? opts.name : 'BME280';
        this.device.type = (opts.hasOwnProperty('type')) ? opts.type : 'sensor';
        this.device.active = false;
        this.device.bus = opts.hasOwnProperty('bus') ? opts.bus : 1;
        this.device.addr = (opts.hasOwnProperty('addr')) ? opts.addr : 0x76;
        this.device.elevation = (opts.hasOwnProperty('elevation')) ? Number(opts.elevation) : 0;
        this.device.mode = (opts.hasOwnProperty('mode')) ? opts.mode : 'forced';
        this.device.refresh = (opts.hasOwnProperty('refresh')) ? opts.refresh : 10000;
        this.device.version = require('./package.json').version;
        this.device.parameters = [
            {name: 'pressure', type: 'float', value: NaN},
            {name: 'temperature', type: 'float', value: NaN},
            {name: 'humidity', type: 'float', value: NaN}
        ];

        this.isStale = true;
        this.timer = null;

        // this.bus = i2c.openSync(this.device.bus);
    }

    deviceBus() {
        return this.device.bus;
    }

    deviceName() {
        return this.device.name;
    }

    deviceType() {
        return this.device.type;
    }

    deviceVersion() {
        return this.device.version;
    }

    deviceNumValues() {
        return this.device.parameters.length;
    }

    typeAtIndex(idx) {
        return this.device.parameters[idx].type;
    }

    nameAtIndex(idx) {
        return this.device.parameters[idx].name;
    }

    valueSavedAtIndex(idx) {
        return this.device.parameters[idx].value;
    }

    deviceActive() {
        return this.device.active;
    }

    randomizeParamValues = () => {
        let min = -5.0, max = 4.0;
        this.device.parameters[0].value = 965.0 + Math.floor(Math.random() * (max - min + 1) + min);
        this.device.parameters[1].value = 22.4 + Math.floor(Math.random() * (max - min + 1) + min);
        this.device.parameters[2].value = 0.78 + Math.floor(Math.random() * (max - min + 1) / 100 + min / 100);
    };

    getDataFromDevice() {
        return new Promise((resolve, reject) => {
            this.randomizeParamValues();
            setTimeout(() => {
                resolve();
            }, 3 + Math.random() * 10);
        });
    }

    getDataFromDeviceSync() {
        this.randomizeParamValues();
        return true;
    }
};