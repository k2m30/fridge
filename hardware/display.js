'use strict';
const os = require('os');
const gd = require('node-gd');


function getBuffer(data) {
    if (Array.isArray(data)) {
        return new Buffer.from(data);
    } else {
        return new Buffer.from([data]);
    }
}

// EPD7IN5B commands
const PANEL_SETTING = 0x00;
const POWER_SETTING = 0x01;
const POWER_OFF = 0x02;
const POWER_OFF_SEQUENCE_SETTING = 0x03;
const POWER_ON = 0x04;
const POWER_ON_MEASURE = 0x05;
const BOOSTER_SOFT_START = 0x06;
const DEEP_SLEEP = 0x07;
const DATA_START_TRANSMISSION_1 = 0x10;
const DATA_STOP = 0x11;
const DISPLAY_REFRESH = 0x12;
const IMAGE_PROCESS = 0x13;
const LUT_FOR_VCOM = 0x20;
const LUT_BLUE = 0x21;
const LUT_WHITE = 0x22;
const LUT_GRAY_1 = 0x23;
const LUT_GRAY_2 = 0x24;
const LUT_RED_0 = 0x25;
const LUT_RED_1 = 0x26;
const LUT_RED_2 = 0x27;
const LUT_RED_3 = 0x28;
const LUT_XON = 0x29;
const PLL_CONTROL = 0x30;
const TEMPERATURE_SENSOR_COMMAND = 0x40;
const TEMPERATURE_CALIBRATION = 0x41;
const TEMPERATURE_SENSOR_WRITE = 0x42;
const TEMPERATURE_SENSOR_READ = 0x43;
const VCOM_AND_DATA_INTERVAL_SETTING = 0x50;
const LOW_POWER_DETECTION = 0x51;
const TCON_SETTING = 0x60;
const TCON_RESOLUTION = 0x61;
const SPI_FLASH_CONTROL = 0x65;
const REVISION = 0x70;
const GET_STATUS = 0x71;
const AUTO_MEASUREMENT_VCOM = 0x80;
const READ_VCOM_VALUE = 0x81;
const VCM_DC_SETTING = 0x82;
const FLASH_MODE = 0xe5;

//physical
const RESET_PIN = 11;
const DC_PIN = 22;
const BUSY_PIN = 18;
const CS_PIN = 24;

const EPD_WIDTH = 640;
const EPD_HEIGHT = 380;


module.exports = class Display {

    image;

    constructor(rpio, height, width) {
        this.width = width || EPD_WIDTH;
        this.height = height || EPD_HEIGHT;

        this.image = gd.createSync(this.width, this.height);

        this.colors = {
            black: 0,
            white: 3,
            red: 4,
            yellow: 4,
        };
        this.rpio = rpio;

        // for (let i = 0; i < 256; i++) this.image.colorAllocate(255 - i , 255 - i , 255 );
        for (let i = 0; i < 2; i++) this.image.colorAllocate(255 - i * 85, 255 - i * 85, 255 - i * 85);

        this.rpio.open(RESET_PIN, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(DC_PIN, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(CS_PIN, this.rpio.OUTPUT, this.rpio.LOW);
        this.rpio.open(BUSY_PIN, this.rpio.INPUT);

        this.rpio.spiBegin();
        this.rpio.spiChipSelect(0);
        this.rpio.spiSetClockDivider(64);
        this.rpio.spiSetDataMode(0);

        this.init();
        // this.clear();
    }

    reset() {
        this.rpio.write(RESET_PIN, this.rpio.HIGH);
        this.rpio.msleep(200);
        this.rpio.write(RESET_PIN, this.rpio.LOW);
        this.rpio.msleep(10);
        this.rpio.write(RESET_PIN, this.rpio.HIGH);
        this.rpio.msleep(200);
    }

    send_command(command) {
        this.rpio.write(DC_PIN, 0);
        this.rpio.write(CS_PIN, 0);
        let buffer = getBuffer(command);
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(CS_PIN, 1);
    };

    send_data(data) {
        this.rpio.write(DC_PIN, 1);
        this.rpio.write(CS_PIN, 0);
        let buffer = getBuffer(data);
        // console.log(data);
        this.rpio.spiWrite(buffer, buffer.length);
        this.rpio.write(CS_PIN, 1);
    };

    update() {
        console.log("update start");
        this.wait();
        this.send_command(DATA_START_TRANSMISSION_1);
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
        this.send_command(POWER_ON); // # POWER ON
        this.wait();

        this.send_command(DISPLAY_REFRESH); // # display refresh
        this.rpio.msleep(100);
        this.wait();

        this.send_command(POWER_OFF); // # POWER OFF
        this.wait();
        console.log("update end");
    }

    wait() {
        console.log("e-Paper busy");
        if (os.arch() === 'arm') {
            while (this.rpio.read(BUSY_PIN) === 0) {  //    # 0: idle, 1: busy
                this.rpio.msleep(100);
            }
        }
        console.log("e-Paper busy release");
    }


    init() {
        this.reset();

        this.send_command(POWER_SETTING); // # POWER_SETTING
        this.send_data(0x37);
        this.send_data(0x00);

        this.send_command(PANEL_SETTING);// # PANEL_SETTING
        this.send_data(0xCF);
        this.send_data(0x08);

        this.send_command(PLL_CONTROL); // # PLL_CONTROL
        this.send_data(0x3A); // # PLL:  0-15:0x3C, 15+:0x3A

        this.send_command(VCM_DC_SETTING); // # VCM_DC_SETTING
        this.send_data(0x08); // #this value defines intensity of your red/yellow color

        this.send_command(BOOSTER_SOFT_START); // # BOOSTER_SOFT_START
        this.send_data(0xc7);
        this.send_data(0xcc);
        this.send_data(0x15);

        this.send_command(VCOM_AND_DATA_INTERVAL_SETTING); // # VCOM AND DATA INTERVAL SETTING
        this.send_data(0x77);

        this.send_command(TCON_SETTING); // # TCON_SETTING
        this.send_data(0x22);

        this.send_command(SPI_FLASH_CONTROL); // # FLASH CONTROL
        this.send_data(0x00);

        this.send_command(TCON_RESOLUTION); // # TCON_RESOLUTION
        this.send_data(this.width >> 8); // # source 640
        this.send_data(this.width & 0xff); //
        this.send_data(this.height >> 8); // # gate 384
        this.send_data(this.height & 0xff);

        this.send_command(FLASH_MODE); // # FLASH MODE
        this.send_data(0x03);

        return 0;
    }

    clear(color = this.colors.white) {
        return new Promise(resolve => {
            console.log("clear start");
            this.wait();
            this.send_command(DATA_START_TRANSMISSION_1);
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x += 2) {
                    this.send_data(color << 4 | color);
                }
            }
            this.send_command(POWER_ON);// # POWER ON
            this.wait();
            this.send_command(DISPLAY_REFRESH);// # display refresh
            this.rpio.msleep(100);
            this.wait();
            console.log("clear end");
            resolve();
        });
    }

    stand_by() {
        return new Promise(resolve => {
            this.send_command(POWER_OFF);// # POWER_OFF
            this.wait();

            this.send_command(DEEP_SLEEP); // # DEEP_SLEEP
            this.send_data(0XA5);

            // this.rpio.spiEnd();
            resolve();
        });
    }
};

