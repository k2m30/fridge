## Install

`brew install sqlite3` or `sudo apt install sqlite3 libsqlite3-dev` on Linux

`cd hardware && npm install`

`cd .. && cd frontend && yarn install`

## Run

### No autostart at the moment 

`cd hardware && npm start`

in other terminal

`cd .. && cd frontend && npm start`

### Run in production

`cd hardware && nohup node index.js > /dev/null 2>../hardware.log &`

`cd .. && cd frontend && `