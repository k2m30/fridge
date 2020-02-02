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
    fanOn: true
};

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

updateState();

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

display.image.line(10, 340, 400, 340, display.colors.black);
display.image.line(10, 341, 400, 341, display.colors.black);

if (state.fanOn) {
    fan = gd.openFile('./fan-solid.gif');
    fan.copyMergeGray(display.image, tx + 30, ty - 200, 0, 0, 64, 64, 100);
} else {
    display.image.filledRectangle(tx + 30, ty - 200, tx + 30 + 64, ty - 200 + 64, display.colors.yellow);
}

if (state.coolingOn) {
    flake = gd.openFile('./snowflake.gif');
    flake.copyMergeGray(display.image, tx + 120, ty - 200, 0, 0, 56, 64, 100);
} else {
    display.image.filledRectangle(tx + 120, ty - 200, tx + 120 + 56, ty - 200 + 64, display.colors.yellow);
}


display.update();

display.image.savePng('output.png', 1);
console.log(display.image);


