const Display = require('./display.js');
const display = new Display();
let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};


display.clear();
tx = 480;
ty =  100;
display.image.filledRectangle(0, 0, display.width, display.height, display.colors.white);


display.image.filledRectangle(tx, 0, display.width, display.height, display.colors.yellow);
display.image.stringFT(display.colors.white, './Kanit-ExtraBold.ttf', 54, 0, tx+10, ty, "27.2");
display.image.stringFT(display.colors.white, './Kanit-Regular.ttf', 22, 0, tx+127, ty-45, "°C");
display.image.stringFT(display.colors.white, './Kanit-Regular.ttf', 14, 0, tx+12, ty-60, "temperature");

tx = 480;
ty =  200;
display.image.stringFT(display.colors.white, './Kanit-ExtraBold.ttf', 54, 0, tx+10, ty, "34");
display.image.stringFT(display.colors.white, './Kanit-Regular.ttf', 22, 0, tx+95, ty-45, "%");
display.image.stringFT(display.colors.white, './Kanit-Regular.ttf', 14, 0, tx+12, ty-60, "humidity");

display.image.savePng('output.png', 1);