'use strict';
const os = require('os');
const gd = require('node-gd');

module.exports = class Display {

    image;
    bufBlack;
    bufRed;

    EPD_WIDTH = 640;
    EPD_HEIGHT = 384;

    //BCM
    // reset_pin = 17;
    // dc_pin = 25;
    // busy_pin = 24;
    // cs_pin = 8;

    //physical
    reset_pin = 11;
    dc_pin = 22;
    busy_pin = 18;
    cs_pin = 24;

    constructor(height, width) {
        this.width = width || this.EPD_WIDTH;
        this.height = height || this.EPD_HEIGHT;

        this.bufBlack = new Buffer.alloc(this.width * this.height, 0);
        this.bufRed = new Buffer.alloc(this.width * this.height, 0);

        this.image = gd.createSync(this.width, this.height);
        this.colors = {
            white: this.image.colorAllocate(255, 255, 255),
            black: this.image.colorAllocate(0, 0, 0),
            red: this.image.colorAllocate(255, 0, 0),
            yellow: this.image.colorAllocate(204, 204, 0)
        };
        if (os.arch() === 'arm') {
            this.rpio = require('rpio');
            this.rpio.spiBegin();
            this.rpio.spiSetClockDivider(1280);
            this.init();
            this.clear();
            return this.update();
        } else {
            console.warn("Not using GPIO", os.arch());
        }
    }

    reset() {
        this.rpio.write(this.reset_pin, this.rpio.HIGH);
        this.rpio.msleep(200);
        this.rpio.write(this.reset_pin, this.rpio.LOW);
        this.rpio.msleep(10);
        this.rpio.write(this.reset_pin, this.rpio.HIGH);
        this.rpio.msleep(200);
    }

    send_command(command) {
        this.rpio.write(this.dc_pin, 0);
        this.rpio.write(this.cs_pin, 0);
        let buffer;
        if (Array.isArray(command)) {
            buffer = new Buffer.alloc(command);
        } else {
            buffer = new Buffer.alloc([command]);
        }
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(this.cs_pin, 1);
    };

    send_data(data) {
        this.rpio.write(this.dc_pin, 1);
        this.rpio.write(this.cs_pin, 0);
        let buffer;
        if (Array.isArray(data)) {
            buffer = new Buffer.alloc(data);
        } else {
            buffer = new Buffer.alloc([data]);
        }
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(this.cs_pin, 1);
    };

    update() {
        console.log("update start");
        let hasBlack = false;
        let hasRed = false;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                let color = this.image.height === this.height
                    ? this.image.getPixel(x, y)
                    : this.image.getPixel(this.image.width - y, x);
                if (color < 64) { //white
                    this.bufBlack[x + y * this.width] = 0x00;
                    this.bufRed[x + y * this.width] = 0x00;
                } else if (color < 192) { //black
                    hasBlack = true;
                    this.bufBlack[x + y * this.width] = 0xff;
                    this.bufRed[x + y * this.width] = 0x00;
                } else { // red
                    hasRed = true;
                    this.bufBlack[x + y * this.width] = 0x00;
                    this.bufRed[x + y * this.width] = 0xff;
                }
            }
        }
        this.show();
        console.log("update end");
    }

    wait() {
        console.log("e-Paper busy");
        while (this.rpio.read(this.busy_pin) === 0) {  //    # 0: idle, 1: busy
            this.rpio.msleep(100);
        }
        console.log("e-Paper busy release");
    }

    show() {
        console.log("show start");
        console.log(this.bufBlack);
        console.log(this.bufRed);
        this.send_command(0x10);
        for (let i = 0; i < this.width / 8 * this.height; i++) {
            // for i in range(0, int(this.width / 8 * this.height)){
            console.log(i);
            let temp1 = this.bufBlack[i];
            let temp2 = this.bufRed[i];
            let j = 0;
            let temp3;
            while (j < 8) {
                if ((temp2 & 0x80) === 0x00) {
                    temp3 = 0x04;
                } //#red or yellow
                else if ((temp1 & 0x80) === 0x00) {
                    temp3 = 0x00;
                } //#black
                else {
                    temp3 = 0x03
                } //#white

                temp3 = (temp3 << 4) & 0xFF;
                temp1 = (temp1 << 1) & 0xFF;
                temp2 = (temp2 << 1) & 0xFF;
                j += 1;
                if ((temp2 & 0x80) === 0x00) {
                    temp3 |= 0x04
                }              //#red
                else if ((temp1 & 0x80) === 0x00) {
                    temp3 |= 0x00
                }              //#black
                else {
                    temp3 |= 0x03
                }              //#white
                temp1 = (temp1 << 1) & 0xFF;
                temp2 = (temp2 << 1) & 0xFF;
                this.send_data(temp3);
                j += 1;
            }

        }
        this.send_command(0x04); // # POWER ON
        this.wait();
        this.send_command(0x12); // # display refresh
        this.rpio.msleep(100);
        this.wait();
        console.log("show end");

    }

    init() {
        this.reset();

        this.send_command(0x01); // # POWER_SETTING
        this.send_data(0x37);
        this.send_data(0x00);

        this.send_command(0x00);// # PANEL_SETTING
        this.send_data(0xCF);
        this.send_data(0x08);

        this.send_command(0x30); // # PLL_CONTROL
        this.send_data(0x3A); // # PLL:  0-15:0x3C, 15+:0x3A

        this.send_command(0x82); // # VCM_DC_SETTING
        this.send_data(0x28); // #all temperature  range

        this.send_command(0x06); // # BOOSTER_SOFT_START
        this.send_data(0xc7);
        this.send_data(0xcc);
        this.send_data(0x15);

        this.send_command(0x50); // # VCOM AND DATA INTERVAL SETTING
        this.send_data(0x77);

        this.send_command(0x60); // # TCON_SETTING
        this.send_data(0x22);

        this.send_command(0x65); // # FLASH CONTROL
        this.send_data(0x00);

        this.send_command(0x61); // # TCON_RESOLUTION
        this.send_data(this.width >> 8); // # source 640
        this.send_data(this.width & 0xff); //
        this.send_data(this.height >> 8); // # gate 384
        this.send_data(this.height & 0xff);

        this.send_command(0xe5); // # FLASH MODE
        this.send_data(0x03);

        return 0;
    }

    clear() {
        console.log("clear start");
        this.send_command(0x10);
        for (let i = 0; i < this.width / 8 * this.height; i++) {
            // for i in range(0, int(this.width / 8 * this.height)):
            this.send_data(0x33);
            this.send_data(0x33);
            this.send_data(0x33);
            this.send_data(0x33);
        }
        this.send_command(0x04);// # POWER ON
        this.wait();
        this.send_command(0x12);// # display refresh
        this.rpio.msleep(100);
        this.wait();
        console.log("clear end");
    }

    stand_by() {
        return new Promise(resolve => {
            this.send_command(0x02);// # POWER_OFF
            this.wait();

            this.send_command(0x07); // # DEEP_SLEEP
            this.send_data(0XA5);

            // this.rpio.spiEnd();
            resolve();
        });
    }
};

