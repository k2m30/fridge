import React, {Component} from 'react';
import './Sensors.css';
import {defaults, Line} from 'react-chartjs-2';

defaults.global.animation = false;


class Sensors extends Component {
    state = {
        data: {
            labels: [],
            datasets: []
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            maintainAspectRatio: false
        }
    };

    // bgTemp = ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'];
    bgTemp = ['rgba(170,99,99,0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 99, 132, 0.2)'];
    bgHumidity = ['rgba(59,93,170,0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 0.2)'];
    bgPressure = ['rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 0.2)'];
    borderColors = ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'];

    constructor() {
        super();
        this.getData();
    }

    componentDidMount() {
        this.interval = setInterval(() => this.getData(), 30000)
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    getData() {
        let datasets_temperature = [], datasets_humidity = [], datasets_pressure = [], sensorIDs = [1, 3, 4, 5];
        fetch('http://' + window.location.hostname + ':3000/sensors').then((res) => {
            return res.json();
        }).then((sensors) => {
                for (let i = 0; i < 4; i++) {
                    datasets_temperature[i] = {
                        label: 't' + i.toString(),
                        data: sensors.filter(r => r.sensorID === sensorIDs[i]).map(r => r.temperature),
                        backgroundColor: this.bgTemp[i],
                        borderColor: this.borderColors[0],
                        borderWidth: 0.2,
                        pointRadius: 1.0
                    };

                    datasets_humidity[i] = {
                        label: 'h' + i.toString(),
                        data: sensors.filter(r => r.sensorID === sensorIDs[i]).map(r => r.humidity),
                        backgroundColor: this.bgHumidity[i],
                        borderColor: this.borderColors[1],
                        borderWidth: 0.1,
                        pointRadius: 1.0
                    };

                    datasets_pressure[i] = {
                        label: 'p' + i.toString(),
                        data: sensors.filter(r => r.sensorID === sensorIDs[i]).map(r => r.pressure),
                        backgroundColor: this.bgPressure[i],
                        borderColor: this.borderColors[2],
                        borderWidth: 0.1,
                        pointRadius: 1.0
                    }

                }
                console.log(datasets_temperature);
                this.setState({
                    data_temperature:
                        {
                            datasets: datasets_temperature,
                            labels: sensors.filter(r => {
                                return r.sensorID === 1;
                            }).map(r => {
                                let d = new Date(r.createdAt);
                                if (d.getMinutes() < 10) {
                                    return d.getHours() + ':0' + d.getMinutes();
                                } else {
                                    return d.getHours() + ':' + d.getMinutes();
                                }

                            }),
                        },
                    data_humidity:
                        {
                            datasets: datasets_humidity,
                            labels: sensors.filter(r => {
                                return r.sensorID === 1;
                            }).map(r => {
                                let d = new Date(r.createdAt);
                                if (d.getMinutes() < 10) {
                                    return d.getHours() + ':0' + d.getMinutes();
                                } else {
                                    return d.getHours() + ':' + d.getMinutes();
                                }

                            }),
                        },
                    data_pressure:
                        {
                            datasets: datasets_pressure,
                            labels: sensors.filter(r => {
                                return r.sensorID === 1;
                            }).map(r => {
                                let d = new Date(r.createdAt);
                                if (d.getMinutes() < 10) {
                                    return d.getHours() + ':0' + d.getMinutes();
                                } else {
                                    return d.getHours() + ':' + d.getMinutes();
                                }

                            }),
                        }

                });
                console.log(this.state);
            }
        );

    }

    render() {
        return (
            <div>
                <p>Temperature</p>
                <div>
                    <Line id={'temperature'}
                          data={this.state.data_temperature}
                          options={{maintainAspectRatio: false}}
                          height={300}
                          width={500}/>
                </div>

                <p>Humidity</p>
                <div>
                    <Line id={'humidity'}
                          data={this.state.data_humidity}
                          options={{maintainAspectRatio: false}}
                          height={300}
                          width={500}/>
                </div>

                <p>Pressure</p>
                <div>
                    <Line id={'pressure'}
                          data={this.state.data_pressure}
                          options={{maintainAspectRatio: false}}
                          height={300}
                          width={500}/>
                </div>
            </div>

        )
    }
}

export default Sensors;