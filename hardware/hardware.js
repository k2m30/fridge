os = require('os');

function getBME280() {
    if (os.arch() === 'arm') {
        return require('./BME280')
    } else {
        console.warn("Not using I2C", os.arch());
        return require('./BME280.mock.js');
    }
}

module.exports = {
    Sensor: getBME280(),
};
