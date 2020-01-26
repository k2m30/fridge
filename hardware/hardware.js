os = require('os');
const FRIDGE_PIN = 16;
const FAN_PIN = 12;


function getBME280() {
    if (os.arch() === 'arm') {
        return require('./BME280')
    } else {
        console.warn("Not using I2C", os.arch());
        return require('./BME280.mock.js');
    }
}

function getGPIO() {
    if (os.arch() === 'arm') {
        return require('rpi-gpio');
    } else {
        console.warn("Not using GPIO", os.arch());
        return require('./GPIO.mock.js');
    }
}

const gpio = getGPIO();

module.exports = {
    initGPIO: function () {
        gpio.setup(FRIDGE_PIN, gpio.DIR_OUT, gpio.EDGE_NONE, function () {
            gpio.write(FRIDGE_PIN, false, null);
        }); // cooling
    },
    turnFanOn: function () {
        gpio.write(FAN_PIN, true, function (err) {
            if (err) throw err;
            console.warn('Fan on');
        });
    },

    turnFanOff: function () {
        gpio.write(FAN_PIN, false, function (err) {
            if (err) throw err;
            console.warn('Fan off');
        });
    },

    turnCoolingOn: function () {
        gpio.write(FRIDGE_PIN, false, function (err) {
            if (err) throw err;
            console.warn('Cooling on');
        });
    },

    turnCoolingOff: function () {
        gpio.write(FRIDGE_PIN, true, function (err) {
            if (err) throw err;
            console.warn('Cooling off');
        });
    },
    BME280: getBME280(),

};
