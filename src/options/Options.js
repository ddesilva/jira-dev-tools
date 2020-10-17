import React, { Component } from 'react';
import '@polymer/paper-button/paper-button.js';

import './Options.css';

class Options extends Component {

  constructor(props) {
    super(props);

    this.state = {
      jiraUrl: ''
    };
  }

  componentDidMount() {
    chrome.storage.sync.get('jiraUrl', data => {
      console.log(data.jiraUrl);
      this.setState({jiraUrl: data.jiraUrl});
    });
  }

  save = ()=> {
    chrome.storage.sync.set({ jiraUrl: this.state.jiraUrl });
  }


  render() {
    const {jiraUrl} = this.state;
    return (
      <div className="App">
        <header className="App-header">
          <input className="Jira-Url" type="text" value={jiraUrl} onChange={e => this.setState({jiraUrl: e.target.value})}/>
          
          <paper-button toggles raised class="green" onClick={this.save}>Save</paper-button>
        </header>
      </div>
    );
  }
}

export default Options;
