const gd = require('node-gd');
const Display = require('./display.js');
const display = new Display();
let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};

async function d(){
    display.image = await gd.openFile('/Users/user/projects/e-Paper/pic/7in5c-b.bmp');
    display.update();
}

// display.image.stringFT(display.colors.red, './Roboto-Regular.ttf', 12, 0, 10, 60, "t = " + state.t + "° " + "h = " + state.h + "%");
// display.image.stringFT(display.colors.yellow, './Roboto-Regular.ttf', 12, 0, 10, 120, "t = " + state.t + "° " + "h = " + state.h + "%");
// display.image.savePng('output.png', 1);

d();
//
// gd.openFile('/Users/user/projects/e-Paper/pic/7in5c-b.bmp', file, rej => {    console.log(rej);});
// display.update();
// display.image = file;
// display.image.savePng('output.png', 1);


