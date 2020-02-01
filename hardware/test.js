const Display = require('./display.js');
const display = new Display();
let state = {
    t: 0,
    h: 0,
    coolingOn: false,
    fanOn: false
};
// for (let i = 0; i < 7; i++) display.clear(i);

display.clear();
// font1 = './Kanit-ExtraBold.ttf';
font1 = './Roboto-Regular.ttf';
font2 = './Kanit-Regular.ttf';

display.image.filledRectangle(0, 0, display.width, display.height, display.colors.white);
tx = 420;
ty = 100;

display.image.filledRectangle(tx, 0, display.width, display.height, display.colors.yellow);
display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, "27.2");
display.image.stringFT(display.colors.white, font2, 28, 0, tx + 175, ty - 45, "°C");
display.image.stringFT(display.colors.white, font2, 18, 0, tx + 12, ty - 72, "temperature");

ty = 200;
display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.white, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.white, font2, 18, 0, tx + 12, ty - 72, "humidity");

ty = 300;
display.image.stringFT(display.colors.black, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.black, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.black, font2, 18, 0, tx + 12, ty - 72, "humidity");

////////////////////
tx = 200;
ty = 100;

display.image.stringFT(display.colors.yellow, font1, 72, 0, tx + 10, ty, "27.2");
display.image.stringFT(display.colors.yellow, font2, 28, 0, tx + 175, ty - 45, "°C");
display.image.stringFT(display.colors.yellow, font2, 18, 0, tx + 12, ty - 72, "temperature");

ty = 200;
display.image.stringFT(display.colors.black, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.black, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.black, font2, 18, 0, tx + 12, ty - 72, "humidity");

ty = 300;
display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.white, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.white, font2, 18, 0, tx + 12, ty - 72, "humidity");

/////////////
display.image.filledRectangle(0, 0, 200, display.height, display.colors.black);
tx = 0;
ty = 100;

display.image.stringFT(display.colors.yellow, font1, 72, 0, tx + 10, ty, "27.2");
display.image.stringFT(display.colors.yellow, font2, 28, 0, tx + 175, ty - 45, "°C");
display.image.stringFT(display.colors.yellow, font2, 18, 0, tx + 12, ty - 72, "temperature");

ty = 200;
display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.white, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.white, font2, 18, 0, tx + 12, ty - 72, "humidity");

ty = 300;
display.image.stringFT(display.colors.white, font1, 72, 0, tx + 10, ty, "34");
display.image.stringFT(display.colors.white, font2, 28, 0, tx + 115, ty - 45, "%");
display.image.stringFT(display.colors.white, font2, 18, 0, tx + 12, ty - 72, "humidity");


display.update();

let a =[];
for (let y = 0; y < display.height; y++) {
    for (let x = 0; x < display.width; x += 2) {
        color1 = display.image.getPixel(x, y);
        color2 = display.image.getPixel(x + 1, y);
        byte = color1 << 4 | color2;
        a.push(color1);
        a.push(color2);
        // console.log(byte.toString(2));
        // display.send_data(byte);
    }
    console.log(a);
    a = [];
}

display.image.savePng('output.png', 1);