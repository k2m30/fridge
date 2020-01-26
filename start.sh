#!/bin/bash
cd hardware || exit
nohup node index.js > ../hardware.log 2> ../hardware_error.log &
cd ..
cd frontend || exit
nohup npm run start > ../frontend.log 2> ../frontend_error.log &
exit 0