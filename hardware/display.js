'use strict';
const os = require('os');
const gd = require('node-gd');

// EPD7IN5B commands
// #define PANEL_SETTING                               0x00
// #define POWER_SETTING                               0x01
// #define POWER_OFF                                   0x02
// #define POWER_OFF_SEQUENCE_SETTING                  0x03
// #define POWER_ON                                    0x04
// #define POWER_ON_MEASURE                            0x05
// #define BOOSTER_SOFT_START                          0x06
// #define DEEP_SLEEP                                  0x07
// #define DATA_START_TRANSMISSION_1                   0x10
// #define DATA_STOP                                   0x11
// #define DISPLAY_REFRESH                             0x12
// #define IMAGE_PROCESS                               0x13
// #define LUT_FOR_VCOM                                0x20
// #define LUT_BLUE                                    0x21
// #define LUT_WHITE                                   0x22
// #define LUT_GRAY_1                                  0x23
// #define LUT_GRAY_2                                  0x24
// #define LUT_RED_0                                   0x25
// #define LUT_RED_1                                   0x26
// #define LUT_RED_2                                   0x27
// #define LUT_RED_3                                   0x28
// #define LUT_XON                                     0x29
// #define PLL_CONTROL                                 0x30
// #define TEMPERATURE_SENSOR_COMMAND                  0x40
// #define TEMPERATURE_CALIBRATION                     0x41
// #define TEMPERATURE_SENSOR_WRITE                    0x42
// #define TEMPERATURE_SENSOR_READ                     0x43
// #define VCOM_AND_DATA_INTERVAL_SETTING              0x50
// #define LOW_POWER_DETECTION                         0x51
// #define TCON_SETTING                                0x60
// #define TCON_RESOLUTION                             0x61
// #define SPI_FLASH_CONTROL                           0x65
// #define REVISION                                    0x70
// #define GET_STATUS                                  0x71
// #define AUTO_MEASUREMENT_VCOM                       0x80
// #define READ_VCOM_VALUE                             0x81
// #define VCM_DC_SETTING                              0x82


function getBuffer(data) {
    if (Array.isArray(data)) {
        return new Buffer.from(data);
    } else {
        return new Buffer.from([data]);
    }
}


module.exports = class Display {

    image;
    bufBlack;
    bufRed;

    EPD_WIDTH = 640;
    EPD_HEIGHT = 380;

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

        this.image = gd.createSync(this.width, this.height);

        for (let i = 0; i < 8; i++) this.image.colorAllocate(255 - i * 32, 255 - i * 32, 255 - i * 32);

        this.colors = {
            black: 0,
            grey1: 1,
            grey2: 2,
            white: 3,
            red0: 4,
            red1: 5,
            red2: 6,
            red3: 7
        };
        this.rpio = require('rpio');
        if (os.arch() === 'arm') {
            this.rpio.init({mapping: 'physical', gpiomem: false});
        } else {
            this.rpio.init({mapping: 'physical', gpiomem: false, mock: 'raspi-3'});
            console.warn("Not using GPIO", os.arch());
        }
        this.rpio.open(this.reset_pin, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(this.dc_pin, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(this.cs_pin, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(this.busy_pin, this.rpio.INPUT);

        this.rpio.spiBegin();
        this.rpio.spiChipSelect(0);
        this.rpio.spiSetClockDivider(64);
        this.rpio.spiSetDataMode(0);

        this.init();
        // this.clear();
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
        let buffer = getBuffer(command);
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(this.cs_pin, 1);
    };

    send_data(data) {
        this.rpio.write(this.dc_pin, 1);
        this.rpio.write(this.cs_pin, 0);
        let buffer = getBuffer(data);
        // console.log(data);
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(this.cs_pin, 1);
    };

    update() {
        console.log("update start");
        this.send_command(0x10);
        let color1, color2, byte;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x += 2) {
                color1 = this.image.getPixel(x, y);
                color2 = this.image.getPixel(x + 1, y);
                byte = color1 << 4 | color2;
                // console.log(byte.toString(2));
                this.send_data(byte);
            }
        }
        this.send_command(0x04); // # POWER ON
        this.wait();

        this.send_command(0x12); // # display refresh
        this.rpio.msleep(100);
        this.wait();

        this.send_command(0x02); // # POWER OFF
        this.wait();
        console.log("update end");
    }

    wait() {
        console.log("e-Paper busy");
        if (os.arch() === 'arm') {
            while (this.rpio.read(this.busy_pin) === 0) {  //    # 0: idle, 1: busy
                this.rpio.msleep(100);
            }
        }
        console.log("e-Paper busy release");
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
        this.send_data(0x14); // #all temperature  range

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

