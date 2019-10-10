var PATH = '/sys/class/gpio';
var PINS = {
    v1: {
        // 1: 3.3v
        // 2: 5v
        '3': 0,
        // 4: 5v
        '5': 1,
        // 6: ground
        '7': 4,
        '8': 14,
        // 9: ground
        '10': 15,
        '11': 17,
        '12': 18,
        '13': 21,
        // 14: ground
        '15': 22,
        '16': 23,
        // 17: 3.3v
        '18': 24,
        '19': 10,
        // 20: ground
        '21': 9,
        '22': 25,
        '23': 11,
        '24': 8,
        // 25: ground
        '26': 7
    },
    v2: {
        // 1: 3.3v
        // 2: 5v
        '3': 2,
        // 4: 5v
        '5': 3,
        // 6: ground
        '7': 4,
        '8': 14,
        // 9: ground
        '10': 15,
        '11': 17,
        '12': 18,
        '13': 27,
        // 14: ground
        '15': 22,
        '16': 23,
        // 17: 3.3v
        '18': 24,
        '19': 10,
        // 20: ground
        '21': 9,
        '22': 25,
        '23': 11,
        '24': 8,
        // 25: ground
        '26': 7,

        // Model B+ pins
        // 27: ID_SD
        // 28: ID_SC
        '29': 5,
        // 30: ground
        '31': 6,
        '32': 12,
        '33': 13,
        // 34: ground
        '35': 19,
        '36': 16,
        '37': 26,
        '38': 20,
        // 39: ground
        '40': 21
    }
};

var RETRY_OPTS = {
    retries: 100,
    minTimeout: 10,
    factor: 1
};

var DIR_IN = 'in';
var DIR_OUT = 'out';
var DIR_LOW = 'low';
var DIR_HIGH = 'high';

var MODE_RPI = 'mode_rpi';
var MODE_BCM = 'mode_bcm';

var EDGE_NONE = 'none';
var EDGE_RISING = 'rising';
var EDGE_FALLING = 'falling';
var EDGE_BOTH = 'both';

function Gpio() {
    var currentPins;
    var currentValidBcmPins;
    var exportedInputPins = {};
    var exportedOutputPins = {};
    var getPinForCurrentMode = getPinRpi;
    var pollers = {};

    this.DIR_IN = DIR_IN;
    this.DIR_OUT = DIR_OUT;
    this.DIR_LOW = DIR_LOW;
    this.DIR_HIGH = DIR_HIGH;

    this.MODE_RPI = MODE_RPI;
    this.MODE_BCM = MODE_BCM;

    this.EDGE_NONE = EDGE_NONE;
    this.EDGE_RISING = EDGE_RISING;
    this.EDGE_FALLING = EDGE_FALLING;
    this.EDGE_BOTH = EDGE_BOTH;

    /**
     * Set pin reference mode. Defaults to 'mode_rpi'.
     *
     * @param {string} mode Pin reference mode, 'mode_rpi' or 'mode_bcm'
     */
    this.setMode = function (mode) {
        if (mode === this.MODE_RPI) {
            getPinForCurrentMode = getPinRpi;
        } else if (mode === this.MODE_BCM) {
            getPinForCurrentMode = getPinBcm;
        } else {
            throw new Error('Cannot set invalid mode');
        }
    };

    /**
     * Setup a channel for use as an input or output
     *
     * @param {number}   channel   Reference to the pin in the current mode's schema
     * @param {string}   direction The pin direction, either 'in' or 'out'
     * @param edge       edge Informs the GPIO chip if it needs to generate interrupts. Either 'none', 'rising', 'falling' or 'both'. Defaults to 'none'
     * @param {function} onSetup   Optional callback
     */
    this.setup = function (channel, direction, edge, onSetup /*err*/) {

    };

    /**
     * Write a value to a channel
     *
     * @param {number}   channel The channel to write to
     * @param {boolean}  value   If true, turns the channel on, else turns off
     * @param {function} cb      Optional callback
     */
    this.write = this.output = function (channel, value, cb /*err*/) {

    };

    /**
     * Read a value from a channel
     *
     * @param {number}   channel The channel to read from
     * @param {function} cb      Callback which receives the channel's boolean value
     */
    this.read = this.input = function (channel, cb /*err,value*/) {
    };

    /**
     * Unexport any pins setup by this module
     *
     * @param {function} cb Optional callback
     */
    this.destroy = function (cb) {
        var tasks = Object.keys(exportedOutputPins)
            .concat(Object.keys(exportedInputPins))
            .map(function (pin) {
                return new Promise(function (resolve, reject) {
                    removeListener(pin, pollers)
                    unexportPin(pin)
                        .then(resolve)
                        .catch(reject);
                });
            });

        Promise.all(tasks)
            .then(function () {
                return cb();
            })
            .catch(function (err) {
                return cb(err);
            });
    };

    /**
     * Reset the state of the module
     */
    this.reset = function () {
    };

    // Init
    this.reset();


    // Private functions requring access to state
    function setRaspberryVersion() {
    };

    function getPinRpi(channel) {
    };

    function getPinBcm(channel) {
    };


    function listen(channel, onChange) {
    };
}

function setEdge(pin, edge) {
    debug('set edge %s on pin %d', edge.toUpperCase(), pin);
    return new Promise(function (resolve, reject) {
        fs.writeFile(PATH + '/gpio' + pin + '/edge', edge, function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

function setDirection(pin, direction) {
    debug('set direction %s on pin %d', direction.toUpperCase(), pin);
    return new Promise(function (resolve, reject) {
        fs.writeFile(PATH + '/gpio' + pin + '/direction', direction, function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

function exportPin(pin) {
    debug('export pin %d', pin);
    return new Promise(function (resolve, reject) {
        fs.writeFile(PATH + '/export', pin, function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

function unexportPin(pin) {
    debug('unexport pin %d', pin);
    return new Promise(function (resolve, reject) {
        fs.writeFile(PATH + '/unexport', pin, function (err) {
            if (err) {
                return reject(err);
            }
            return resolve();
        });
    });
}

function isExported(pin) {
    return new Promise(function (resolve, reject) {
        fs.exists(PATH + '/gpio' + pin, function (exists) {
            return resolve(exists);
        });
    });
}

function removeListener(pin, pollers) {
    if (!pollers[pin]) {
        return
    }
    debug('remove listener for pin %d', pin)
    pollers[pin]()
    delete pollers[pin]
}

function clearInterrupt(fd) {
    fs.readSync(fd, Buffer.alloc(1), 0, 1, 0);
}

var GPIO = new Gpio();

// Promise
GPIO.promise = {

    /**
     * @see {@link Gpio.setup}
     * @param channel
     * @param direction
     * @param edge
     * @returns {Promise}
     */
    setup: function (channel, direction, edge) {
        return new Promise(function (resolve, reject) {
            function done(error) {
                if (error) return reject(error);
                resolve();
            }

            GPIO.setup(channel, direction, edge, done)
        })
    },

    /**
     * @see {@link Gpio.write}
     * @param channel
     * @param value
     * @returns {Promise}
     */
    write: function (channel, value) {
        return new Promise(function (resolve, reject) {
            function done(error) {
                if (error) return reject(error);
                resolve();
            }

            GPIO.write(channel, value, done)
        })
    },

    /**
     * @see {@link Gpio.read}
     * @param channel
     * @returns {Promise}
     */
    read: function (channel) {
        return new Promise(function (resolve, reject) {
            function done(error, result) {
                if (error) return reject(error);
                resolve(result);
            }

            GPIO.read(channel, done)
        })
    },

    /**
     * @see {@link Gpio.destroy}
     * @returns {Promise}
     */
    destroy: function () {
        return new Promise(function (resolve, reject) {
            function done(error) {
                if (error) return reject(error);
                resolve();
            }

            GPIO.destroy(done)
        })
    }
};

module.exports = GPIO;
