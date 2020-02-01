const hw = require('./hardware');
const db = require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const Display = require('./display.js');
const os = require('os');

db.init();

//physical pins
const FAN_PIN = 32;
const FRIDGE_PIN = 36;

const rpio = require('rpio');
if (os.arch() === 'arm') {
    rpio.init({mapping: 'physical', gpiomem: false});
} else {
    rpio.init({mapping: 'physical', gpiomem: false, mock: 'raspi-3'});
    console.warn("Not using GPIO", os.arch());
}
rpio.open(FRIDGE_PIN, rpio.OUTPUT);
rpio.open(FAN_PIN, rpio.OUTPUT);


const display = new Display(rpio);

const Readings = db.Reading;
const Settings = db.Setting;

const Sensor = hw.Sensor;
const sensor_1 = new Sensor({bus: 4});
const sensor_2 = new Sensor({bus: 5});
const sensor_3 = new Sensor({bus: 3});
const sensor_4 = new Sensor({bus: 1});

let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};

function turnCoolingIfNeeded() {
    Settings.findAll().then(settings => settings[0]).then(s => {
        if (state.t > s.tHigh) {
            rpio.write(FRIDGE_PIN, rpio.LOW);
            state.coolingOn = true;
        }

        if (state.t < s.tLow) {
            rpio.write(FRIDGE_PIN, rpio.HIGH);
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


function turnSonicIfNeeded() {

}

function turnFanIfNeeded() {
    Settings.findAll().then(settings => settings[0]).then(s => {
        if (state.h > s.hHigh) {
            rpio.write(FAN_PIN, rpio.LOW);
            state.fanOn = false;
        }

        if (state.h < s.hLow) {
            rpio.write(FAN_PIN, rpio.HIGH);
            state.fanOn = true;
        }
    });

}

function loop() {
    Readings.create(readBME280(sensor_1));
    Readings.create(readBME280(sensor_2));
    Readings.create(readBME280(sensor_3));
    Readings.create(readBME280(sensor_4));

    turnCoolingIfNeeded();
    turnSonicIfNeeded();
    turnFanIfNeeded();
}

function displayLoop() {
}

function updateState() {
    Readings.findAll({limit: 50}).done((data, e) => {
        r1 = data[0];
        r2 = data[1];
        r3 = data[2];
        r4 = data[3];

        const temperatures = [r1.temperature, r2.temperature, r3.temperature, r4.temperature];
        let max = Math.max(...temperatures);
        let min = Math.min(...temperatures);
        state.t = (temperatures.reduce((sum, x) => sum + x) - min - max) / 2.0;

        const humidities = [r1.humidity, r2.humidity, r3.humidity, r4.humidity];
        max = Math.max(...humidities);
        min = Math.min(...humidities);
        state.h = (humidities.reduce((sum, x) => sum + x) - min - max) / 2.0;
        console.log(state);
    });
}


function clearDisplay() {
    display.clear(display.colors.black);
    display.clear(display.colors.yellow);
    display.clear();
}


const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

app.use(express.static(path.join(__dirname, 'public')));
app.get('/sensors', (req, res) => {
    Readings.findAll({
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
setInterval(clearDisplay, 60000 * 60 * 24);
setInterval(updateState, 60000);
loop();