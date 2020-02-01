const gd = require('node-gd');
const Display = require('./display.js');
const display = new Display();
let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};

async function e() {
    // display.image = await gd.openFile('/Users/user/projects/e-Paper/pic/7in5c-b.bmp');
    display.image = await gd.openFile('/home/pi/e-Paper/RaspberryPi&JetsonNano/python/pic/7in5c-b.bmp');
    let x = 2;
    let y = 3;
    let color1 = display.image.getPixel(x, y);
    let color2 = display.image.getPixel(x + 1, y);
    for (let y = 0; y < display.height; y++) {
        for (let x = 0; x < display.width; x += 2) {
            let color1 = display.image.getPixel(x, y);
            let color2 = display.image.getPixel(x + 1, y);
            // display.send_data(getColorByte(color1, color2))
            console.log(color1, color2);
        }
    }
    console.log(color1, color2);
    // console.log(color2);
    // display.update();
}

display.send_command(0x10);

for (let i = 0; i < 640 * 384 / 2; i++) {
    display.send_data(0b00110011);
}

display.send_command(0x04);
display.wait();
display.send_command(0x12);
display.wait();
display.send_command(0x02);
display.wait();

for (let i = 0; i < 5; i++) {
    display.image.filledRectangle(display.width / 5 * i, 0, display.width / 5 * (i + 1), display.height, i);
}


display.image.stringFT(display.colors.red0, './Roboto-Regular.ttf', 22, 0, 10, 10, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.red1, './Roboto-Regular.ttf', 22, 0, 10, 60, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.red2, './Roboto-Regular.ttf', 22, 0, 10, 110, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.red3, './Roboto-Regular.ttf', 22, 0, 10, 160, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.white, './Roboto-Regular.ttf', 22, 0, 10, 210, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.black, './Roboto-Regular.ttf', 22, 0, 10, 260, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.grey1, './Roboto-Regular.ttf', 22, 0, 10, 310, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.stringFT(display.colors.grey2, './Roboto-Regular.ttf', 22, 0, 10, 360, "t = " + state.t + "° " + "h = " + state.h + "%");
display.image.savePng('output.png', 1);

console.log("update start");
display.send_command(0x10);
let color1, color2, byte;
for (let y = 0; y < 384; y++) {
    for (let x = 0; x < 640; x += 2) {
        color1 = display.image.getPixel(x, y);
        color2 = display.image.getPixel(x + 1, y);
        byte = color1 << 4 | color2;
        // console.log(byte.toString(2));
        display.send_data(byte);
    }
}
display.send_command(0x04); // # POWER ON
display.wait();

display.send_command(0x12); // # display refresh
display.rpio.msleep(100);
display.wait();

display.send_command(0x02); // # POWER OFF
display.wait();
console.log("update end");


d();
//
// gd.openFile('/Users/user/projects/e-Paper/pic/7in5c-b.bmp', file, rej => {    console.log(rej);});
// display.update();
// display.image = file;
// display.image.savePng('output.png', 1);


