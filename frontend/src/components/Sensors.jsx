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

    constructor() {
        super();
        let datasets = [], sensorIDs = [1, 3, 4, 5];
        fetch('http://localhost:3000/sensors').then((res) => {
            return res.json();
        }).then((sensors) => {
                for (let i = 0; i < 4; i++) {
                    datasets[i] = {
                        label: 't' + i.toString(),
                        data: sensors.filter(r => {
                            return r.sensorID === sensorIDs[i];
                        }).map(r => r.temperature),
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }
                }
                console.log(datasets);
                this.setState({
                    data:
                        {
                            datasets: datasets,
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
        let data = {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        };


        return (
            <div>
                <Line data={this.state.data}
                      options={{maintainAspectRatio: false}}
                      height={300}
                      width={500}/>
                <div><p></p></div>
            </div>
        )
    }
}

export default Sensors;