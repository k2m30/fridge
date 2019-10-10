const hw = require('./hardware');
const db = require('./db');
const YAML = require('yaml');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');

db.init();
hw.initGPIO();

const Reading = db.Reading;
const Settings = db.Setting;

const BME280 = hw.BME280;
const bme280_1 = new BME280({bus: 1});
const bme280_2 = new BME280({bus: 3});
const bme280_3 = new BME280({bus: 4});
const bme280_4 = new BME280({bus: 5});

function turnCoolingIfNeeded(r1, r2, r3, r4) {
    let threshold = YAML.parse(fs.readFileSync('./settings.yml', 'utf8'));

    let temperatures = [r1.temperature, r2.temperature, r3.temperature, r4.temperature];
    let max = Math.max(...temperatures);
    let min = Math.min(...temperatures);
    let t = (temperatures.reduce((sum, x) => sum + x) - min - max) / 2.0;

    if (t > threshold.temperature.max) {
        hw.turnCoolingOn();
    }

    if (t < threshold.temperature.min) {
        hw.turnCoolingOff();
    }

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

}

function loop() {
    let r1 = readBME280(bme280_1);
    let r2 = readBME280(bme280_2);
    let r3 = readBME280(bme280_3);
    let r4 = readBME280(bme280_4);

    console.log((r1));
    console.log((r2));
    console.log((r3));
    console.log((r4));

    Reading.create(r1);
    Reading.create(r2);
    Reading.create(r3);
    Reading.create(r4);

    turnCoolingIfNeeded(r1, r2, r3, r4);
    turnSonicIfNeeded(r1, r2, r3, r4);
    turnFanIfNeeded(r1, r2, r3, r4);
}

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/sensors', (req, res) => {
    db.Reading.findAll({
        limit: 1200, order: [['id', 'DESC']]
    }).then(readings => {
        res.json(readings.reverse());
    });
});

app.get('/', (req, res) => {
    db.Reading.findAll({limit: 300}).then(readings => {
        res.json(readings);
    });
});


app.listen(3000, () => console.log(`Example app listening on port 3000!`));


setInterval(loop, 60000);
