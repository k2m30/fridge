const SQLite3 = require('sequelize');
const Op = SQLite3.Op;

module.exports = {
    Op: Op,
    Reading: class extends SQLite3.Model {
    },
    Setting: class extends SQLite3.Model {
    },
    State: class extends SQLite3.Model {
    },
    init: function () {
        const sequelize = new SQLite3({
            dialect: 'sqlite',
            storage: '../database.sqlite',
            logging: false
        });

        sequelize
            .authenticate()
            .then(() => {
                console.log('Connection has been established successfully.');
            })
            .catch(err => {
                console.error('Unable to connect to the database:', err);
            });
        this.Reading.init({
            // attributes
            sensorID: {
                type: SQLite3.INTEGER,
                allowNull: false
            },
            temperature: {
                type: SQLite3.FLOAT,
                allowNull: false
            },
            humidity: {
                type: SQLite3.FLOAT,
                allowNull: false
            },
            pressure: {
                type: SQLite3.FLOAT,
                allowNull: false
            },
        }, {
            sequelize,
            timestamps: true,
            indexes: [
                {fields: ['createdAt']},
                {fields: ['sensorID']}
            ]
            // options
        });

        this.Setting.init({
                tLow: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
                tHigh: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
                hLow: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
                hHigh: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
            },
            {
                sequelize
            });

        this.State.init({
                coolingOn: {
                    type: SQLite3.BOOLEAN,
                    allowNull: false
                },
                internalFanOn: {
                    type: SQLite3.BOOLEAN,
                    allowNull: false
                },
                externalFanOn: {
                    type: SQLite3.BOOLEAN,
                    allowNull: false
                },
                t: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
                h: {
                    type: SQLite3.FLOAT,
                    allowNull: false
                },
            },
            {
                sequelize,
                timestamps: true
            });

        // this.Reading.sync({force: true}).then(() => {
        this.Reading.sync().then(() => {
        });

        this.State.sync().then(() => {
        });

        // this.Setting.sync({force: true}).then(() => {
        this.Setting.sync().then(() => {
            this.Setting.findAndCountAll().then(res => {
                if (res.count === 0) {
                    this.Setting.create({tLow: 10.0, tHigh: 14.5, hLow: 30.0, hHigh: 50.0});
                }
            });
        });
    },
};
