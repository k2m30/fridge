import React, {Component} from 'react';
import './Sensors.css';
import {defaults, Line} from 'react-chartjs-2';

defaults.global.animation = false;


class State extends Component {
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

    bgTemp = ['rgba(170,99,99,0.2)', 'rgba(255, 99, 132, 0.5)'];
    bgHumidity = ['rgba(59,93,170,0.2)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.2)'];
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
        let datasets_temperature = [], datasets_humidity = [], dataset_cooling = [], dataset_internal_fan = [],
            dataset_external_fan = [];
        fetch('http://' + window.location.hostname + ':3000/state').then((res) => {
            return res.json();
        }).then((state) => {

                datasets_temperature = [
                    {
                        label: 'temperature',
                        data: state.map(r => Math.round(r.t * 100) / 100),
                        backgroundColor: this.bgTemp[0],
                        borderColor: this.borderColors[0],
                        borderWidth: 0.2,
                        pointRadius: 1.0
                    },
                    {
                        label: 'cooling',
                        data: state.map(r => r.coolingOn * 5),
                        backgroundColor: this.bgTemp[1],
                        borderColor: this.borderColors[1],
                        borderWidth: 0.2,
                        pointRadius: 1.0
                    }
                ];

                datasets_humidity = [
                    {
                        label: 'humidity',
                        data: state.map(r => Math.round(r.h * 100) / 100),
                        backgroundColor: this.bgHumidity[0],
                        borderColor: this.borderColors[2],
                        borderWidth: 0.1,
                        pointRadius: 1.0
                    },
                    {
                        label: 'internalFanOn',
                        data: state.map(r => r.internalFanOn * 50),
                        backgroundColor: this.bgHumidity[1],
                        borderColor: this.borderColors[3],
                        borderWidth: 0.1,
                        pointRadius: 1.0
                    },
                    {
                        label: 'externalFanOn',
                        data: state.map(r => r.externalFanOn * 50),
                        backgroundColor: this.bgHumidity[2],
                        borderColor: this.borderColors[3],
                        borderWidth: 0.1,
                        pointRadius: 1.0
                    }
                ];


                console.log(datasets_temperature);
                this.setState({
                    data_temperature:
                        {
                            datasets: datasets_temperature,
                            labels: state.map(r => {
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
                            labels: state.map(r => {
                                let d = new Date(r.createdAt);
                                if (d.getMinutes() < 10) {
                                    return d.getHours() + ':0' + d.getMinutes();
                                } else {
                                    return d.getHours() + ':' + d.getMinutes();
                                }

                            }),
                        },
                    average_humidity: Math.round(state.map(r => r.h).reduce((p, c) => p + c, 0) / state.length * 100) / 100,
                    current_temperature: Math.round(state[state.length - 1].t * 100) / 100,
                });
                console.log(this.state);
            }
        );

    }

    render() {
        return (
            <div>
                <p>Temperature = {this.state.current_temperature}</p>
                <div>
                    <Line id={'temperature'}
                          data={this.state.data_temperature}
                          options={{maintainAspectRatio: false}}
                          height={300}
                          width={500}/>
                </div>

                <p>Humidity </p>
                <p>Average humidity = {this.state.average_humidity}</p>
                <div>
                    <Line id={'humidity'}
                          data={this.state.data_humidity}
                          options={{maintainAspectRatio: false}}
                          height={300}
                          width={500}/>
                </div>
            </div>

        )
    }
}

export default State;