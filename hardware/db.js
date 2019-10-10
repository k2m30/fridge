const SQLite3 = require('sequelize');

module.exports = {
    Reading: class extends SQLite3.Model {
    },
    Setting: class extends SQLite3.Model {
    },
    init: function () {
        const sequelize = new SQLite3({
            dialect: 'sqlite',
            storage: '../database.sqlite'
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

        // this.Reading.sync({force: true}).then(() => {
        this.Reading.sync().then(() => {
        });
    },
};
