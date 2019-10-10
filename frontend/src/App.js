import React, {Component} from 'react';
import './App.css';
import Sensors from "./components/Sensors";

class App extends Component {
    render() {
        return (

            <div className="App">
                <p>
                    Prosciutto di hackerspace
                </p>
                <div>
                    <Sensors/>
                </div>
            </div>

        );
    }
}

export default App;
