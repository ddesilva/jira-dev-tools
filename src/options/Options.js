import React, { Component } from 'react';
import '@polymer/paper-button/paper-button.js';

import './Options.css';

class Options extends Component {

  constructor(props) {
    super(props);

    this.state = {
      numberOfCanaryChar: 50,
      canaryName: '',
      enableGitPush: true,
      enableCanary: false,
      canaryNames: []
    };
  }

  componentDidMount() {
    chrome.storage.sync.get(['canaryNames', 'enableGitPush', 'enableCanary', 'numberOfCanaryChar'], data => {
      this.setState({canaryNames: data.canaryNames, enableGitPush: data.enableGitPush, enableCanary: data.enableCanary, numberOfCanaryChar: data.numberOfCanaryChar});
    });
  }

  save = ()=> {
    const canaryNames = this.state.canaryNames;
    const numberOfCanaryChar = this.state.numberOfCanaryChar;
    const enableGitPush = this.state.enableGitPush;
    const enableCanary = this.state.enableCanary;
    chrome.storage.sync.set({ canaryNames, numberOfCanaryChar, enableGitPush, enableCanary});
  };

  addCanaryName = () => {
    const canaryNames = this.state.canaryNames;
    const canaryName = this.state.canaryName;
    canaryNames.push({name: canaryName, isDefault: false});
    this.setState({canaryNames});

    chrome.storage.sync.set({ canaryNames });
  };

  removeCanaryName = (canaryName) => {
    const canaryNames = this.state.canaryNames;
    const canaryNameToRemove = canaryName.name;

    const updatedArray = canaryNames.reduce((acc, canaryName) => {
      if(canaryNameToRemove !== canaryName.name) {
        acc.unshift(canaryName);
      }
      return acc;
    }, []);

    this.setState({canaryNames: updatedArray});
  };

  render() {
    const {numberOfCanaryChar,  canaryName, canaryNames, enableGitPush, enableCanary} = this.state;
    return (
      <div className="App">
        <header className="App-header">
          Jira Dev Tools - Options
        </header>
        <div className={'container'}>

          <div className={'form'}>
            <div className={'form-row'}>
              Enable git push?
              <input type="checkbox" className="form-input" checked={enableGitPush} onChange={e => this.setState({enableGitPush: e.target.checked})}/>
            </div>

            <div className={'form-row'}>
              Enable canary?
              <input type="checkbox" className="form-input" checked={enableCanary} onChange={e => this.setState({enableCanary: e.target.checked})}/>
            </div>
            <div className={'form-row'}>
              Max number of characters of canary name:
              <input className="form-input" type="text" value={numberOfCanaryChar} onChange={e => this.setState({numberOfCanaryChar: e.target.value})}/>
            </div>

            <div className={'form-row'}>
              Canary Cookie names:
              <div className={'canary-names-wrapper'}>
                { canaryNames.map(canaryName => {
                  return (
                    <div className="canary-item">
                      <div className="canary-item-name">{canaryName.name} </div>
                      <div className={'canary-item-actions'}>
                        <button onClick={() =>this.removeCanaryName(canaryName)}>delete</button>
                      </div>
                    </div>
                  );})}
              </div>
              <input className="form-input" type="text" value={canaryName} placeholder={'Enter canary name (ie: checkout-app)'} onChange={e => this.setState({canaryName: e.target.value})}/>
              <paper-button class="save-small" onClick={this.addCanaryName}>Add </paper-button>
            </div>


          </div>
          <paper-button class="save" onClick={this.save}>Save</paper-button>

        </div>

      </div>
    );
  }
}

export default Options;
