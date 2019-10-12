import React, {Component} from 'react';
import './Controls.css';

class Controls extends Component {
    state = {};

    constructor() {
        super();
        this.getThreshold();
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    changeThreshold() {
        const body = {
            tLow: document.getElementById('t-low').value,
            tHigh: document.getElementById('t-high').value,
            hLow: document.getElementById('h-low').value,
            hHigh: document.getElementById('h-high').value
        };
        console.log(body);
        fetch('http://' + window.location.hostname + ':3000/thresholds', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).catch(err => console.log(err));
    }

    render() {
        return (
            <div>
                <h3>Threshold</h3>
                <label htmlFor="t-low">t° low</label>
                <input type="text" id={'t-low'} onChange={this.changeThreshold}/>

                <label htmlFor="t-high">t° high</label>
                <input type="text" id={'t-high'} onChange={this.changeThreshold}/>

                <label htmlFor="h-low">h low, %</label>
                <input type="text" id={'h-low'} onChange={this.changeThreshold}/>

                <label htmlFor="h-high">h high, %</label>
                <input type="text" id={'h-high'} onChange={this.changeThreshold}/>

                <hr/>
            </div>

        )
    }

    getThreshold() {
        fetch('http://' + window.location.hostname + ':3000/thresholds')
            .then(res => {
                return res.json();
            })
            .then(json => {
                return json;
            })
            .then(json => {
                document.getElementById('t-low').value = json.tLow;
                document.getElementById('t-high').value = json.tHigh;
                document.getElementById('h-low').value = json.hLow;
                document.getElementById('h-high').value = json.hHigh;
            })
    };

    checkElement = async selector => {
        while (document.querySelector(selector) === null) {
            await new Promise(r => setTimeout(r, 500))
        }
        return document.querySelector(selector);
    };
}

export default Controls;