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

//graph
const ZERO_X = 10;
const END_X = 410;
const STEP_X = 8;
const H_ZERO_Y = 350;
const T_ZERO_Y = 170;

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
    tHigh: 0,
    tLow: 0,
    hHigh: 0,
    hLow: 0,
    hData: [],
    tData: [],
    tFrost: 0
};

async function turnCoolingIfNeeded() {
    Settings.findAll().then(settings => settings[0]).then(s => {
        if (state.t > s.tHigh) {
            rpio.write(FRIDGE_PIN, rpio.LOW);
            state.coolingOn = true;
            console.log("Fridge is on");
        }

        if (state.t < s.tLow) {
            rpio.write(FRIDGE_PIN, rpio.HIGH);
            state.coolingOn = false;
            console.log("Fridge is off");
        }

    });
}

async function readBME280(device) {
    device.getDataFromDeviceSync();
    const measurement = {
        sensorID: device.device.bus,
        temperature: device.device.parameters[1].value,
        pressure: device.device.parameters[0].value,
        humidity: device.device.parameters[2].value
    };
    console.log(measurement);
    return measurement;
}


async function turnSonicIfNeeded() {

}

async function turnFanIfNeeded() {
    if (state.tFrost > 7.0) {
        rpio.write(FAN_PIN, rpio.LOW);
        state.fanOn = false;
        console.log("Fan is off");
    }

    if (state.tFrost < 4.0) {
        rpio.write(FAN_PIN, rpio.HIGH);
        state.fanOn = true;
        console.log("Fan is on");
    }
}

async function loop() {
    // console.log(readBME280(sensor_1));
    await Readings.create(await readBME280(sensor_1));
    await Readings.create(await readBME280(sensor_2));
    await Readings.create(await readBME280(sensor_3));
    await Readings.create(await readBME280(sensor_4));
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
        const y0h = H_ZERO_Y - state.hData[i];
        const y1h = H_ZERO_Y - state.hData[i + 1];

        const y0t = T_ZERO_Y - state.tData[i] * 5;
        const y1t = T_ZERO_Y - state.tData[i + 1] * 5;

        const x0 = ZERO_X + i * STEP_X;
        const x1 = ZERO_X + (i + 1) * STEP_X;
        display.image.line(x0, Math.round(y0h), x1, Math.round(y1h), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0h), x1 + 1, Math.round(y1h), display.colors.black);

        display.image.line(x0, Math.round(y0t), x1, Math.round(y1t), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0t), x1 + 1, Math.round(y1t), display.colors.black);
    }
    //axis
    display.image.line(ZERO_X, T_ZERO_Y, END_X, T_ZERO_Y, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y + 1, END_X, T_ZERO_Y + 1, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y, ZERO_X, T_ZERO_Y - 150, display.colors.black);
    display.image.line(ZERO_X + 1, T_ZERO_Y, ZERO_X + 1, T_ZERO_Y - 150, display.colors.black);

    display.image.line(ZERO_X, H_ZERO_Y, END_X, H_ZERO_Y, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y + 1, END_X, H_ZERO_Y + 1, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y, ZERO_X, H_ZERO_Y - 150, display.colors.black);
    display.image.line(ZERO_X + 1, H_ZERO_Y, ZERO_X + 1, H_ZERO_Y - 150, display.colors.black);

    //limits
    display.image.line(ZERO_X, T_ZERO_Y - state.tLow * 5, END_X, T_ZERO_Y - state.tLow * 5, display.colors.yellow);
    display.image.line(ZERO_X, T_ZERO_Y + 1 - state.tLow * 5, END_X, T_ZERO_Y + 1 - state.tLow * 5, display.colors.yellow);

    display.image.line(ZERO_X, T_ZERO_Y - state.tHigh * 5, END_X, T_ZERO_Y - state.tHigh * 5, display.colors.yellow);
    display.image.line(ZERO_X, T_ZERO_Y + 1 - state.tHigh * 5, END_X, T_ZERO_Y + 1 - state.tHigh * 5, display.colors.yellow);

    //limits
    display.image.line(ZERO_X, H_ZERO_Y - state.hLow, END_X, H_ZERO_Y - state.hLow, display.colors.yellow);
    display.image.line(ZERO_X, H_ZERO_Y + 1 - state.hLow, END_X, H_ZERO_Y + 1 - state.hLow, display.colors.yellow);

    display.image.line(ZERO_X, H_ZERO_Y - state.hHigh, END_X, H_ZERO_Y - state.hHigh, display.colors.yellow);
    display.image.line(ZERO_X, H_ZERO_Y + 1 - state.hHigh, END_X, H_ZERO_Y + 1 - state.hHigh, display.colors.yellow);

    display.image.stringFT(display.colors.yellow, font2, 12, 0, ZERO_X + 4, H_ZERO_Y - state.hHigh - 4, state.hHigh.toFixed(0));
    display.image.stringFT(display.colors.yellow, font2, 12, 0, ZERO_X + 4, H_ZERO_Y - state.hHigh + 14, state.hLow.toFixed(0));

    display.update();

}

async function updateState() {
    const data = await Readings.findAll({
        limit: DATA_DEEP * 3,
        order: [['id', 'DESC']],
        where: {[db.Op.or]: [{sensorID: 3}, {sensorID: 4}, {sensorID: 5}]}
    });
    const tData = [];
    const hData = [];

    for (let i = 0; i < DATA_DEEP * 3; i += 3) {
        tData.push((data[i].temperature + data[i + 1].temperature + data[i + 2].temperature) / 3.0);
        hData.push((data[i].humidity + data[i + 1].humidity + data[i + 2].humidity) / 3.0);
    }

    state.hData = hData.reverse();
    state.tData = tData.reverse();

    console.log(tData);
    console.log(hData);

    const settings = await Settings.findAll();
    state.tLow = Math.round(settings[0].tLow);
    state.tHigh = Math.round(settings[0].tHigh);
    state.hLow = Math.round(settings[0].hLow);

    state.hHigh = Math.round(settings[0].hHigh);
    const tFrost = await Readings.findAll({limit: 1, order: [['id', 'DESC']], where: {sensorID: 1}});
    state.tFrost = tFrost[0].temperature;
    state.t = (data[1].temperature + data[2].temperature + data[3].temperature) / 3.0;
    state.h = (data[1].humidity + data[2].humidity + data[3].humidity) / 3.0;

    await turnCoolingIfNeeded();
    await turnSonicIfNeeded();
    await turnFanIfNeeded();
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
