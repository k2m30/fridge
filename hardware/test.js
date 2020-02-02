const db = require('./db');
const os = require('os');
const gd = require('node-gd');
const Readings = db.Reading;
db.init();

const rpio = require('rpio');
if (os.arch() === 'arm') {
    rpio.init({mapping: 'physical', gpiomem: false});
} else {
    rpio.init({mapping: 'physical', gpiomem: false, mock: 'raspi-3'});
    console.warn("Not using GPIO", os.arch());
}


const Display = require('./display.js');
const display = new Display(rpio);

let state = {
    t: 18.2356,
    h: 54.431,
    coolingOn: true,
    fanOn: true,
    hData: [],
    tData: []
};


async function updateState() {
    const data = await Readings.findAll({limit: DATA_DEEP * 4, order: [['id', 'DESC']]});
    const r1 = data[0];
    const r2 = data[1];
    const r3 = data[2];
    const r4 = data[3];

    tData = [];
    hData = [];
    data.map(t => {
        tData.push(t.temperature);
        hData.push(t.humidity * 100)
    });

    console.log(tData);
    console.log(hData);

    state.hData = hData.reverse();
    state.tData = tData.reverse();


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

function dump(image, x1 = 0, y1 = 0, x2 = image.width, y2 = image.height) {
    for (let i = y1; i < y2; i++) {
        let str = [];
        for (let j = x1; j < x2; j++) {
            str.push(image.getPixel(j, i));
        }
        console.log(str);
    }
}

async function main() {
    await updateState();

    display.clear();
    console.log(state);
    font1 = './Kanit-ExtraBold.ttf';
    font2 = './Kanit-Regular.ttf';
    display.image.setAntiAliased(0);
    display.image.filledRectangle(0, 0, display.width, display.height, display.colors.white);
    tx = 422;
    ty = 110;

    display.image.filledRectangle(tx, 0, display.width, display.height, display.colors.yellow);
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, state.t.toFixed(1));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 175, ty - 45, "°C");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "temperature");


    ty = 360;
    display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, state.h.toFixed(0));
    display.image.stringFT(display.colors.white, font2, 28, 0, tx + 119, ty - 45, "%");
    display.image.stringFT(display.colors.white, font2, 20, 0, tx + 12, ty - 72, "humidity");

    display.image.line(10, 340, 410, 340, display.colors.black);
    display.image.line(10, 341, 410, 341, display.colors.black);
    display.image.line(10, 342, 410, 342, display.colors.black);

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

    DATA_DEEP = 50;
    ZERO_X = 10;
    STEP_X = 8;
    H_ZERO_Y = 340;
    T_ZERO_Y = 220;

    for (let i = 0; i < DATA_DEEP - 1; i++) {
        y0h = H_ZERO_Y - state.hData[i];
        y1h = H_ZERO_Y - state.hData[i + 1];

        y0t = T_ZERO_Y - state.tData[i] * 5;
        y1t = T_ZERO_Y - state.tData[i + 1] * 5;

        x0 = ZERO_X + i * STEP_X;
        x1 = ZERO_X + (i + 1) * STEP_X;
        display.image.line(x0, Math.round(y0h), x1, Math.round(y1h), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0h), x1 + 1, Math.round(y1h), display.colors.black);

        display.image.line(x0, Math.round(y0t), x1, Math.round(y1t), display.colors.black);
        display.image.line(x0 + 1, Math.round(y0t), x1 + 1, Math.round(y1t), display.colors.black);
    }


// dump(display.image, tx + 30, ty - 200, tx + 30 + 64, ty - 200 + 64);
    display.update();
// dump(display.image, tx + 30, ty - 200, tx + 30 + 64, ty - 200 + 64);

    display.image.savePng('output.png', 1);
// console.log(display.image);
}

main();