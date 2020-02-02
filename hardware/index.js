const hw = require('./hardware');
const db = require('./db');
const gd = require('node-gd');
const express = require('express');
const cors = require('cors');
const path = require('path');
const Display = require('./display.js');
const os = require('os');

db.init();

//physical pins
const FAN_PIN = 32;
const FRIDGE_PIN = 36;
const DOOR_PIN = 12;
const DATA_DEEP = 50;
const ZERO_X = 10;
const STEP_X = 8;
const H_ZERO_Y = 340;
const T_ZERO_Y = 220;

const rpio = require('rpio');
if (os.arch() === 'arm') {
    rpio.init({mapping: 'physical', gpiomem: false});
} else {
    rpio.init({mapping: 'physical', gpiomem: false, mock: 'raspi-3'});
    console.warn("Not using GPIO", os.arch());
}
rpio.open(FRIDGE_PIN, rpio.OUTPUT);
rpio.open(FAN_PIN, rpio.OUTPUT);
rpio.open(DOOR_PIN, rpio.INPUT);

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
    fanOn: false,
    h_data: [],
    t_data: []
};

async function turnCoolingIfNeeded() {
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

async function readBME280(device) {
    device.getDataFromDeviceSync();
    return {
        sensorID: device.device.bus,
        temperature: device.device.parameters[1].value,
        pressure: device.device.parameters[0].value,
        humidity: device.device.parameters[2].value
    };
}


async function turnSonicIfNeeded() {

}

async function turnFanIfNeeded() {
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

async function loop() {
    // console.log(readBME280(sensor_1));
    await Readings.create(await readBME280(sensor_1));
    await Readings.create(await readBME280(sensor_2));
    await Readings.create(await readBME280(sensor_3));
    await Readings.create(await readBME280(sensor_4));

    await turnCoolingIfNeeded();
    await turnSonicIfNeeded();
    await turnFanIfNeeded();
}

async function displayLoop() {
    const font1 = './Kanit-ExtraBold.ttf';
    const font2 = './Kanit-Regular.ttf';
    display.image.setAntiAliased(0);
    display.image.filledRectangle(0, 0, display.width, display.height, display.colors.white);
    let tx = 422;
    let ty = 110;

    display.image.filledRectangle(tx, 0, display.width, display.height, display.colors.yellow);
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, state.t.toFixed(1));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 175, ty - 45, "°C");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "temperature");


    ty = 360;
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, state.h.toFixed(0));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 119, ty - 45, "%");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "humidity");

    display.image.line(10, 340, 400, 340, display.colors.black);
    display.image.line(10, 341, 400, 341, display.colors.black);

    let fan, flake;
    if (state.fanOn) {
        fan = gd.openFile('./fan-solid.gif');
        display.addImage(fan, tx + 30, ty - 200, 2, display.colors.white);
    } else {
        display.image.filledRectangle(tx + 30, ty - 200, tx + 30 + 64, ty - 200 + 64, display.colors.yellow);
    }

    if (state.coolingOn) {
        flake = gd.openFile('./snowflake.gif');
        display.addImage(flake, tx + 120, ty - 200, 2, display.colors.white);
    } else {
        display.image.filledRectangle(tx + 120, ty - 200, tx + 120 + 56, ty - 200 + 64, display.colors.yellow);
    }

    for (let i = 0; i < DATA_DEEP - 1; i++) {
        y0h = H_ZERO_Y - state.h_data[i];
        y1h = H_ZERO_Y - state.h_data[i + 1];

        y0t = T_ZERO_Y - state.t_data[i] * 5;
        y1t = T_ZERO_Y - state.t_data[i + 1] * 5;

        x0 = ZERO_X + i * STEP_X;
        x1 = ZERO_X + (i + 1) * STEP_X;
        display.image.line(x0, Math.round(y0h), x1, Math.round(y1h), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0h), x1 + 1, Math.round(y1h), display.colors.black);

        display.image.line(x0, Math.round(y0t), x1, Math.round(y1t), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0t), x1 + 1, Math.round(y1t), display.colors.black);
    }


    display.update();

}

async function updateState() {
    const data = await Readings.findAll({limit: 50, order: [['id', 'DESC']]});
    const r1 = data[0];
    const r2 = data[1];
    const r3 = data[2];
    const r4 = data[3];

    const t_data = [];
    const h_data = [];
    data.map(t => {
        t_data.push(t.temperature);
        h_data.push(t.humidity)
    });

    console.log(t_data);
    console.log(h_data);

    state.h_data = h_data.reverse();
    state.t_data = t_data.reverse();

    const temperatures = [r1.temperature, r2.temperature, r3.temperature, r4.temperature];

    let max = Math.max(...temperatures);
    let min = Math.min(...temperatures);
    state.t = (temperatures.reduce((sum, x) => sum + x) - min - max) / 2.0;

    const humidities = [r1.humidity, r2.humidity, r3.humidity, r4.humidity];
    max = Math.max(...humidities);
    min = Math.min(...humidities);
    state.h = (humidities.reduce((sum, x) => sum + x) - min - max) / 2.0;
    console.log(state);
}


async function clearDisplay() {
    display.clear(display.colors.black);
    display.clear(display.colors.yellow);
    display.clear();
}

async function main() {
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

    await updateState();
    loop();
    displayLoop();
}

main();
