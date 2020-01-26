## Install

`brew install sqlite3` or `sudo apt install sqlite3 libsqlite3-dev` on Linux

`cd hardware && npm install`

`cd .. && cd frontend && yarn install`

## Run

device name – fridge.local

device ip – 192.168.128.95

### No autostart at the moment 

`cd hardware && npm start`

in other terminal

`cd .. && cd frontend && npm start`

### Open in browser

`http://fridge.local:3000/sensors` – raw data

`http://fridge.local:3001` – GUI

### Run in production

`./start.sh`

## Deploy
```
git push && ssh pi@fridge.local 'cd fridge && git pull'
```

## Pinout

| Color  | Name | BCM  | HW | HW  | BCM | Name  | Color |
| --- | --- |--- | --- |--- | --- |--- | --- |
| Red  | 3.3V  | |1 | 2 | | 5V | Orange
| Yellow  | SDA1 (Sensor 4) | |3 | 4 | | 5V | 
| White  | SCL1 (Sensor 4)  | |5 | 6 | | GND | Black
|   |   | |7 | 8 | |  | 
|   |   | |9 | 10 | |  | 
| White  | RST (Disp)  | 17 |11 | 12 |18 | Door IN | Yellow
| Blue   | Relay 1  | 27|13 | 14 | |  | 
|   |   | |15 | 16 | |  | 
|   |   | |17 | 18 | 24 | Busy (Disp) | Violet 
| Blue   | DIN (Disp)  | MOSI |19 | 20 | |  | 
|   |   | |21 | 22 | 25 | DC (Disp) | Green
| Yellow  | CLK(Disp)  | SCLK |23 | 24 | CE0 | CS(Disp) | Orange 
|   |   | |25 | 26 | |  | 
|   |   | |27 | 28 | |  | 
|   |   | |29 | 30 | |  | 
| Yellow  | SDA5 (Sensor 2)  | 6 |31 | 32 |12 | Relay 2 (Fan) | Green 
| White  | SCL5 (Sensor 2)  |13 |33 | 34 | | GND | 
| Yellow  | SDA3 (Sensor 3)  | 19|35 | 36 |16 | Relay 3 (Fridge) | Yellow
| White  | SCL3 (sensor 3)  | 26|37 | 38 | | SDA4 (Sensor 1) | Yellow
|   | GND  | |39 | 40 | | SCL4 (Sensor 1) | White

## Config

At /boot/config.txt

```
dtparam=i2c_arm=on
dtoverlay=i2c-gpio,bus=5,i2c_gpio_delay_us=1,i2c_gpio_sda=6,i2c_gpio_scl=13
dtoverlay=i2c-gpio,bus=4,i2c_gpio_delay_us=1,i2c_gpio_sda=20,i2c_gpio_scl=21
dtoverlay=i2c-gpio,bus=3,i2c_gpio_delay_us=1,i2c_gpio_sda=19,i2c_gpio_scl=26

gpio=12,16,27=op
gpio=18=ip
```

