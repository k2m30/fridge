os = require('os');
const COOLING_PIN = 7;


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
        gpio.setup(COOLING_PIN, gpio.DIR_OUT, gpio.EDGE_NONE, function () {
            gpio.write(COOLING_PIN, false, null);
        }); // cooling
    },
    turnCoolingOn: function () {
        gpio.write(COOLING_PIN, true, function (err) {
            if (err) throw err;
            console.log('Written to pin');
        });
    },

    turnCoolingOff: function () {
        gpio.write(COOLING_PIN, false, function (err) {
            if (err) throw err;
            console.log('Written to pin');
        });
    },
    BME280: getBME280(),

};
