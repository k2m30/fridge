const hw = require('./hardware');
const db = require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const Display = require('./display.js');

db.init();
hw.initGPIO();
display = new Display();

const Reading = db.Reading;
const Settings = db.Setting;

const BME280 = hw.BME280;
const bme280_1 = new BME280({bus: 4});
const bme280_2 = new BME280({bus: 5});
const bme280_3 = new BME280({bus: 3});
const bme280_4 = new BME280({bus: 1});

let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};

function test() {
    const Display = require('./display.js');
    const display = new Display();
    let state = {
        t: 0,
        h: 0,
        coolingOn: false,
        fanOn: false
    };

    display.image.stringFT(display.colors.red, './Roboto-Regular.ttf', 12, 0, 10, 60, "t = " + state.t + "° " + "h = " + state.h + "%");
    display.image.stringFT(display.colors.yellow, './Roboto-Regular.ttf', 12, 0, 10, 120, "t = " + state.t + "° " + "h = " + state.h + "%");
    display.image.savePng('output.png', 1);
    //BCM
    reset_pin = 17;
    dc_pin = 25;
    busy_pin = 24;
    cs_pin = 8;

    //physical
    reset_pin = 11;
    dc_pin = 22;
    busy_pin = 18;
    cs_pin = 24;


    rpio = require('rpio');
    rpio.init({mapping: 'physical', gpiomem: false});
    rpio.open(reset_pin, rpio.OUTPUT, rpio.LOW);
    rpio.open(dc_pin, rpio.OUTPUT, rpio.LOW);
    rpio.open(cs_pin, rpio.OUTPUT, rpio.LOW);
    rpio.open(busy_pin, rpio.INPUT);
    rpio.spiBegin();
    rpio.spiChipSelect(0);                  /* Use CE0 */
    rpio.spiSetClockDivider(128);           /* AT93C46 max is 2MHz, 128 == 1.95MHz */
    rpio.spiSetDataMode(0);



    width = 640;
    height = 384;
    send_command(0x10);
    for (let i = 0; i < width / 8 * height; i++) {
        // for i in range(0, int(this.width / 8 * this.height)):
        send_data(0x33);
        send_data(0x33);
        send_data(0x33);
        send_data(0x33);
    }
    send_command(0x04);// # POWER ON
    send_command(0x12);// # display refresh



}

function send_command(command) {
    rpio.write(dc_pin, 0);
    let buffer;
    buffer = new Buffer([command]);
    console.log(buffer);
    rpio.spiWrite(buffer, buffer.length);
};

function send_data(command) {
    rpio.write(dc_pin, 1);
    let buffer;
    buffer = new Buffer([command]);
    console.log(buffer);
    rpio.spiWrite(buffer, buffer.length);
};

function turnCoolingIfNeeded(r1, r2, r3, r4) {
    Settings.findAll().then(settings => settings[0]).then(s => {
        const temperatures = [r1.temperature, r2.temperature, r3.temperature, r4.temperature];
        const max = Math.max(...temperatures);
        const min = Math.min(...temperatures);
        const t = (temperatures.reduce((sum, x) => sum + x) - min - max) / 2.0;
        console.log("Average Temperature is " + t + "°");
        state.t = t;
        if (t > s.tHigh) {
            hw.turnCoolingOn();
            state.coolingOn = true;
        }

        if (t < s.tLow) {
            hw.turnCoolingOff();
            state.coolingOn = false;
        }

    });
}

function readBME280(device) {
    device.getDataFromDeviceSync();
    return {
        sensorID: device.device.bus,
        temperature: device.device.parameters[1].value,
        pressure: device.device.parameters[0].value,
        humidity: device.device.parameters[2].value
    };
}


function turnSonicIfNeeded(r1, r2, r3, r4) {

}

function turnFanIfNeeded(r1, r2, r3, r4) {
    Settings.findAll().then(settings => settings[0]).then(s => {
        const humidities = [r1.humidity, r2.humidity, r3.humidity, r4.humidity];
        const max = Math.max(...humidities);
        const min = Math.min(...humidities);
        const h = (humidities.reduce((sum, x) => sum + x) - min - max) / 2.0;
        console.log("Average Humidity is " + h + "%");
        state.h = h;
        if (h > s.hHigh) {
            hw.turnFanOff();
            state.fanOn = false;
        }

        if (h < s.hLow) {
            hw.turnFanOn();
            state.fanOn = true;
        }

    });

}

function loop() {
    const r1 = readBME280(bme280_1);
    const r2 = readBME280(bme280_2);
    const r3 = readBME280(bme280_3);
    const r4 = readBME280(bme280_4);

    Reading.create(r1);
    Reading.create(r2);
    Reading.create(r3);
    Reading.create(r4);

    console.log(r1);
    console.log(r2);
    console.log(r3);
    console.log(r4);

    turnCoolingIfNeeded(r1, r2, r3, r4);
    turnSonicIfNeeded(r1, r2, r3, r4);
    turnFanIfNeeded(r1, r2, r3, r4);
}

function displayLoop() {
    display.image.stringFTBBox(128, './Roboto-Regular.ttf', 12, 0, 0, 0, "t = " + state.t + "° " + "h = " + state.h + "%");
    // display.image.stringFTBBox(128, '/home/pi/fridge/hardware/Roboto-Regular.ttf', 12, 0, 0, 0, "t = " + state.t + "° " + "h = " + state.h + "%");
    display.update();
}

const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

app.use(express.static(path.join(__dirname, 'public')));
app.get('/sensors', (req, res) => {
    Reading.findAll({
        limit: 1200, order: [['id', 'DESC']]
    }).then(readings => {
        res.json(readings.reverse());
    });
});

app.get('/thresholds', (req, res) => {
    Settings.findAll().then(settings => {
        return res.json(settings[0]);
    });
});

app.post('/thresholds', (req, res, next) => {
    Settings.findAll().then(settings => settings[0]).then(settings => {
        settings.update(req.body)
    });
});

app.listen(3000, () => console.log(`Fridge app listening on port 3000!`));

setInterval(loop, 60000);
setInterval(displayLoop, 60000);
loop();