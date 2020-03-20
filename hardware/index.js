const _ = require('lodash');

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
const INTERNAL_FAN_PIN = 32;
const FRIDGE_PIN = 36;
const DOOR_PIN = 12;
const DATA_DEEP = 50;

//graph
const ZERO_X = 10;
const END_X = 410;
const STEP_X = 8;
const H_ZERO_Y = 360;
const T_ZERO_Y = 170;

const T_DIFF_HIGH_FAN_ON = 3;
const T_DIFF_LOW_FAN_OFF = 0.3;

const rpio = require('rpio');
if (os.arch() === 'arm') {
    rpio.init({mapping: 'physical', gpiomem: false});
} else {
    rpio.init({mapping: 'physical', gpiomem: false, mock: 'raspi-3'});
    console.warn("Not using GPIO", os.arch());
}
rpio.open(FRIDGE_PIN, rpio.OUTPUT);
rpio.open(INTERNAL_FAN_PIN, rpio.OUTPUT);
rpio.open(DOOR_PIN, rpio.INPUT);

const display = new Display(rpio);

const Readings = db.Reading;
const Settings = db.Setting;
const State = db.State;

const Sensor = hw.Sensor;
const sensor_1 = new Sensor({bus: 4});
const sensor_2 = new Sensor({bus: 5});
const sensor_3 = new Sensor({bus: 3});
const sensor_4 = new Sensor({bus: 1});


let __state = {
    t: 0,
    h: 0,
    s_0: undefined,
    s_1: undefined,
    s_2: undefined,
    s_3: undefined,
    t_0: 0,
    t_1: 0,
    t_2: 0,
    t_3: 0,
    tFrost: 0,
    h_0: 0,
    h_1: 0,
    h_2: 0,
    h_3: 0,

    coolingOn: false,
    internalFanOn: false,
    externalFanOn: false,
    tHigh: 0,
    tLow: 0,
    hHigh: 0,
    hLow: 0,
    hData: [],
    tData: [],
    kek: 0,
};

//this only way to get __state
const getState = () => {
    return _.cloneDeep(__state);
};

let stateChanges = [];
let shouldCommitState = false;

//this only way to change __state
const setState = (stateChange) => {
    stateChanges.push(stateChange);
    if (!shouldCommitState) {
        shouldCommitState = true;
        process.nextTick(stateCommit);
    }
};

//do not change __state in this func
const onStateStateChange = (oldState, newState, stateChanges) => {
    console.log('diff=' + JSON.stringify(stateChanges));
};

//this will commit all __state changes;
const stateCommit = () => {

    const oldState = __state;

    let allStateChanges = {};
    stateChanges.forEach((change) => {
        allStateChanges = {...allStateChanges, ...change};
    });
    stateChanges = [];

    const newState = {...__state, ...allStateChanges};

    onStateStateChange(oldState, newState, allStateChanges);

    __state = newState;
    shouldCommitState = false;
};


async function turnCoolingIfNeeded() {
    Settings.findAll().then(settings => settings[0]).then(s => {
        if (__state.t > s.tHigh) {
            rpio.write(FRIDGE_PIN, rpio.LOW);
            __state.coolingOn = true;
            console.log("Fridge is on");
        }

        if (__state.t < s.tLow) {
            rpio.write(FRIDGE_PIN, rpio.HIGH);
            __state.coolingOn = false;
            console.log("Fridge is off");
        }

    });
}

const readBME280 = async (device) => {
    await device.getDataFromDevice();
    const measurement = {
        sensorID: device.deviceBus(),
        pressure: device.valueSavedAtIndex(0),
        temperature: device.valueSavedAtIndex(1),
        humidity: device.valueSavedAtIndex(2),
    };
    console.log("Read data from device :", measurement);
    return measurement;
};


async function turnSonicIfNeeded() {

}

const internalFanOn = (on = true) => {

    rpio.write(INTERNAL_FAN_PIN, on ? rpio.HIGH : rpio.LOW);
    __state.internalFanOn = on;
    console.log("Internal fan is ", (on ? "on" : "off"));

};

const turnFanIfNeeded = async = () => {

    if (__state.coolingOn) {
        internalFanOn(false);
    } else {
        if (Math.abs(__state.t - __state.tHigh) < T_DIFF_LOW_FAN_OFF) {
            internalFanOn(true);
        } else {
            internalFanOn(false);
        }
    }

};

async function loop() {

    console.log(" == Start read sensors == ");
    let n = Date.now();

    let sens1 = await readBME280(sensor_1).catch((err) => {
        console.log(err)
    });
    sens1 && await Readings.create(sens1);

    let sens2 = await readBME280(sensor_2).catch((err) => {
        console.log(err)
    });
    sens2 && await Readings.create(sens2);

    let sens3 = await readBME280(sensor_3).catch((err) => {
        console.log(err)
    });
    sens3 && await Readings.create(sens3);

    let sens4 = await readBME280(sensor_4).catch((err) => {
        console.log(err)
    });
    sens4 && await Readings.create(sens4);

    console.log(" == END read sensors : ", Date.now() - n);
}

async function displayLoop() {
    const font1 = './Kanit-ExtraBold.ttf';
    const font2 = './Kanit-Regular.ttf';
    display.image.setAntiAliased(0);
    display.image.filledRectangle(0, 0, display.width, display.height, display.colors.white);
    let tx = 422;
    let ty = 110;

    display.image.filledRectangle(tx, 0, display.width, display.height, display.colors.black);
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, __state.t.toFixed(1));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 175, ty - 45, "°C");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "temperature");


    ty = 360;
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, __state.h.toFixed(0));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 119, ty - 45, "%");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "humidity");

    let fan, flake;
    if (__state.internalFanOn) {
        fan = gd.openFile('./fan-solid.gif');
        display.addImage(fan, tx + 30, ty - 200, 2, display.colors.white);
    } else {
        display.image.filledRectangle(tx + 30, ty - 200, tx + 30 + 64, ty - 200 + 64, display.colors.black);
    }

    if (__state.coolingOn) {
        flake = gd.openFile('./snowflake.gif');
        display.addImage(flake, tx + 120, ty - 200, 2, display.colors.white);
    } else {
        display.image.filledRectangle(tx + 120, ty - 200, tx + 120 + 56, ty - 200 + 64, display.colors.black);
    }

    for (let i = 0; i < DATA_DEEP - 1; i++) {
        const y0h = H_ZERO_Y - __state.hData[i];
        const y1h = H_ZERO_Y - __state.hData[i + 1];

        const y0t = T_ZERO_Y - __state.tData[i] * 8;
        const y1t = T_ZERO_Y - __state.tData[i + 1] * 8;

        const x0 = ZERO_X + i * STEP_X;
        const x1 = ZERO_X + (i + 1) * STEP_X;
        await display.image.line(x0, Math.round(y0h), x1, Math.round(y1h), display.colors.black);
        await display.image.line(x0 + 1, Math.round(y0h), x1 + 1, Math.round(y1h), display.colors.black);

        await display.image.line(x0, Math.round(y0t), x1, Math.round(y1t), display.colors.black);
        await display.image.line(x0 + 1, Math.round(y0t), x1 + 1, Math.round(y1t), display.colors.black);
    }
    //axis
    display.image.line(ZERO_X, T_ZERO_Y, END_X, T_ZERO_Y, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y + 1, END_X, T_ZERO_Y + 1, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y, ZERO_X, T_ZERO_Y - 150, display.colors.black);
    display.image.line(ZERO_X + 1, T_ZERO_Y, ZERO_X + 1, T_ZERO_Y - 150, display.colors.black);

    display.image.line(ZERO_X, H_ZERO_Y, END_X, H_ZERO_Y, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y + 1, END_X, H_ZERO_Y + 1, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y, ZERO_X, H_ZERO_Y - 100, display.colors.black);
    display.image.line(ZERO_X + 1, H_ZERO_Y, ZERO_X + 1, H_ZERO_Y - 100, display.colors.black);

    //limits
    display.image.line(ZERO_X, T_ZERO_Y - __state.tLow * 8, END_X, T_ZERO_Y - __state.tLow * 8, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y + 1 - __state.tLow * 8, END_X, T_ZERO_Y + 1 - __state.tLow * 8, display.colors.black);

    display.image.line(ZERO_X, T_ZERO_Y - __state.tHigh * 8, END_X, T_ZERO_Y - __state.tHigh * 8, display.colors.black);
    display.image.line(ZERO_X, T_ZERO_Y + 1 - __state.tHigh * 8, END_X, T_ZERO_Y + 1 - __state.tHigh * 8, display.colors.black);

    //limits
    display.image.line(ZERO_X, H_ZERO_Y - __state.hLow, END_X, H_ZERO_Y - __state.hLow, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y + 1 - __state.hLow, END_X, H_ZERO_Y + 1 - __state.hLow, display.colors.black);

    display.image.line(ZERO_X, H_ZERO_Y - __state.hHigh, END_X, H_ZERO_Y - __state.hHigh, display.colors.black);
    display.image.line(ZERO_X, H_ZERO_Y + 1 - __state.hHigh, END_X, H_ZERO_Y + 1 - __state.hHigh, display.colors.black);

    display.image.stringFT(display.colors.black, font2, 12, 0, ZERO_X + 4, H_ZERO_Y - __state.hHigh - 4, __state.hHigh.toFixed(0) + '%');
    display.image.stringFT(display.colors.black, font2, 12, 0, ZERO_X + 4, H_ZERO_Y - __state.hLow + 14, __state.hLow.toFixed(0) + '%');

    display.image.stringFT(display.colors.black, font2, 12, 0, ZERO_X + 4, T_ZERO_Y - __state.tHigh * 8 - 4, __state.tHigh.toFixed(0) + '°C');
    display.image.stringFT(display.colors.black, font2, 12, 0, ZERO_X + 4, T_ZERO_Y - __state.tLow * 8 + 14, __state.tLow.toFixed(0) + '°C');

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
        let t = (data[i].temperature + data[i + 1].temperature + data[i + 2].temperature) / 3.0;
        t = Math.round(t * 100) / 100;

        let h = (data[i].humidity + data[i + 1].humidity + data[i + 2].humidity) / 3.0;
        h = Math.round(h * 100) / 100;

        tData.push(t);
        hData.push(h);
    }

    __state.hData = hData.reverse();
    __state.tData = tData.reverse();

    console.log(tData);
    console.log(hData);

    const settings = await Settings.findAll();
    __state.tLow = Math.round(settings[0].tLow);
    __state.tHigh = Math.round(settings[0].tHigh);
    __state.hLow = Math.round(settings[0].hLow);

    __state.hHigh = Math.round(settings[0].hHigh);
    const tFrost = await Readings.findAll({limit: 1, order: [['id', 'DESC']], where: {sensorID: 1}});
    __state.tFrost = tFrost[0].temperature;
    __state.t = (data[1].temperature + data[2].temperature + data[3].temperature) / 3.0;
    __state.h = (data[1].humidity + data[2].humidity + data[3].humidity) / 3.0;

    await turnCoolingIfNeeded();
    await turnSonicIfNeeded();
    await turnFanIfNeeded();
    await State.create({
        t: __state.t,
        h: __state.h,
        coolingOn: __state.coolingOn,
        internalFanOn: __state.internalFanOn,
        externalFanOn: __state.externalFanOn
    });
    console.log(__state);
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

    app.get('/state', (req, res) => {
        State.findAll({
            limit: 1200, order: [['id', 'DESC']]
        }).then(state => {
            res.json(state.reverse());
        });
    });

    app.get('/thresholds', (req, res) => {
        Settings.findAll().then(settings => {
            return res.json(settings[0]);
        });
    });

    app.post('/thresholds', (req, res, next) => {
        Settings.findAll().then(settings => settings[0]).then(settings => {
            settings.update(req.body);
            // console.log(req.body);
            return res.json("ok");
        });
    });

    app.listen(3000, () => console.log(`Fridge app listening on port 3000!`));

    setInterval(loop, 30000);
    setInterval(displayLoop, 60000);
    setInterval(clearDisplay, 60000 * 60 * 24);
    setInterval(updateState, 60000);

    await updateState();
    await loop();
    await displayLoop();

}


main();
