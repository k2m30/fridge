## Install

`brew install sqlite3` or `sudo apt install sqlite3 libsqlite3-dev` on Linux

`cd hardware && npm install`

`cd .. && cd frontend && yarn install`

## Run

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
| Blue   | Relay 1  | |13 | 14 | |  | 
|   |   | |15 | 16 | |  | 
|   |   | |17 | 18 | 24 | Busy (Disp) | Violet 
| Blue   | DIN (Disp)  | MOSI |19 | 20 | |  | 
|   |   | |21 | 22 | 25 | DC (Disp) | Green
| Yellow  | CLK(Disp)  | SCLK |23 | 24 | CE0 | CS(Disp) | Orange 
|   |   | |25 | 26 | |  | 
|   |   | |27 | 28 | |  | 
|   |   | |29 | 30 | |  | 
| Yellow  | SDA5 (Sensor 2)  | 6 |31 | 32 | | Relay 2 (Fan) | Green 
| White  | SCL5 (Sensor 2)  |13 |33 | 34 | | GND | 
| Yellow  | SDA3 (Sensor 3)  | 19|35 | 36 | | Relay 3 (Fridge) | Yellow
| White  | SCL3 (sensor 3)  | 26|37 | 38 | | SDA4 (Sensor 1) | Yellow
|   | GND  | |39 | 40 | | SCL4 (Sensor 1) | White
