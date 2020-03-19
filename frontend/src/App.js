import React, {Component} from 'react';
import './App.css';
import Sensors from "./components/Sensors";
import Controls from "./components/Controls";
import State from "./components/State";

class App extends Component {
    render() {
        return (

            <div className="App">
                <h2>
                    Prosciutto di hackerspace
                </h2>
                <div><State/></div>
                <hr/>
                <div><Controls/></div>
                <hr/>
                <div><Sensors/></div>
            </div>

        );
    }
}

export default App;
