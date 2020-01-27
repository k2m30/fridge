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


function turnCoolingIfNeeded(r1, r2, r3, r4) {
    Settings.findAll().then(settings => settings[0]).then(s => {
        const temperatures = [r1.temperature, r2.temperature, r3.temperature, r4.temperature];
        const max = Math.max(...temperatures);
        const min = Math.min(...temperatures);
        const t = (temperatures.reduce((sum, x) => sum + x) - min - max) / 2.0;
        console.log("Average Temperature is " + t + "°");
        if (t > s.tHigh) {
            hw.turnCoolingOn();
        }

        if (t < s.tLow) {
            hw.turnCoolingOff();
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
        const p = (humidities.reduce((sum, x) => sum + x) - min - max) / 2.0;
        console.log("Average Humidity is " + p + "%");
        if (p > s.hHigh) {
            hw.turnFanOff();
        }

        if (p < s.hLow) {
            hw.turnFanOn();
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