#!/bin/bash
cd hardware || exit
nohup node index.js > /dev/null 2>../hardware.log &
cd ..
cd frontend || exit
nohup npm run start > /dev/null 2>../frontend.log &