import React, {Component} from 'react';
import './Popup.css';
import '@polymer/paper-button/paper-button.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/iron-icon/iron-icon.js';

class Popup extends Component {

  // TODO: init state with sensible defaults on first run

  constructor(props) {
    super(props);

    this.state = {
      currentItem: {
        currentUrl: '',
        jiraNumber: '',
        newBranchLine: '',
        jiraTitle: '',
        gitPush: '',
        canary: '',
        canaryCookie: '',
        cookieName:'',
      },
      selectedCookieName: '',
      numberOfCanaryChar: 50,
      canaryNames: [],
      invalid: true,
      enableGitPush: true,
      enableCanary: false,
      savedItems: []
    };

    this.initSettings();
  }

  initSettings = () => {
    const {canaryNames, numberOfCanaryChar, enableGitPush, enableCanary} = this.state;

    chrome.storage.sync.get(['canaryNames', 'enableGitPush', 'enableCanary', 'numberOfCanaryChar', 'initialised'], data => {
      if(!data.initialised) {
        chrome.storage.sync.set({canaryNames, numberOfCanaryChar, enableGitPush, enableCanary, initialised: true });
      }
    });
  };

  componentWillMount() {
    document.addEventListener('DOMContentLoaded', this.restoreOptions);
  }

  componentWillUnmount() {
    document.removeEventListener('DOMContentLoaded', this.restoreOptions);
  }

  getQueryParams = url => {
    return url && url.indexOf('?') >= 0 ? url.split('?')[1].split('&') : [];
  };

  getTitle = () =>{
    return document.querySelector('[data-test-id="issue.views.issue-base.foundation.summary.heading"]').innerText;
  };

  getBranchLine = (jiraNumber, jiraTitle) => {
    return `git checkout -b "feature/${jiraNumber}/${jiraTitle}"`;
  };

  getGitPushLine = (jiraNumber, jiraTitle) => {
    return `git push --set-upstream origin feature/${jiraNumber}/${jiraTitle}`;
  };

  getJiraTitleLine = (title) => {
    title = title.toLowerCase().replace(/\s/g, '-').replace(',', '').replace('.', '');
    title = title.replace('---','-');
    title = title.replace('/','');
    title = title.replace('(','');
    title = title.replace(')','');
    return title;
  };

  getCanaryLine = (jiraNumber, title) => {
    const prefix = `feature-${jiraNumber.toLowerCase()}-`;
    const updatedTitle = title.replace(prefix, '');
    const {numberOfCanaryChar} = this.state;
    const fullCanary = prefix + updatedTitle;
    return fullCanary.substring(0, fullCanary.length > numberOfCanaryChar ? fullCanary.charAt(numberOfCanaryChar) !== '-' ? numberOfCanaryChar : numberOfCanaryChar -1 : fullCanary.length);
  };

  getCanary = (jiraNumber, title) => {
    return this.getCanaryLine(jiraNumber, title);
  };

  getCanaryCookie = (jiraNumber, title, canaryName) => {
    if(!canaryName) {
      return '';
    }
    const canary = this.getCanaryLine(jiraNumber, title);
    return `document.cookie="${canaryName}=${canary};path=/"`;
  };

  restoreOptions = () => {

    chrome.storage.sync.get(['savedItems', 'canaryNames', 'enableGitPush', 'enableCanary', 'numberOfCanaryChar'], data => {
      if(data.savedItems) {
        this.setState({savedItems: data.savedItems});
      }
      this.setState({canaryNames: data.canaryNames, enableGitPush: data.enableGitPush, enableCanary: data.enableCanary, numberOfCanaryChar: data.numberOfCanaryChar});
    });

    const scriptToRun = `(${this.getTitle})()`;

    // Run the script in the context of the tab
    chrome.tabs.executeScript({
      code: scriptToRun
    }, (result) => {


      chrome.tabs.query({currentWindow: true, active: true}, tabs =>{
        const currentUrl = tabs[0].url;
        const fullPageJiraNumber = currentUrl.substring(currentUrl.lastIndexOf('/')+1, currentUrl.length);

        const jiraTitle = this.getJiraTitleLine(result[0]);
        const queryParams = this.getQueryParams(currentUrl);
        const popupJiraNumber = queryParams.reduce((acc, item) => {

          if(item.startsWith('selectedIssue')) {
            acc = item.substring(item.indexOf('=')+1, item.length);
          }
          return acc;
        }, '');


        const jiraNumber = popupJiraNumber || fullPageJiraNumber;

        const canary = this.getCanary(jiraNumber, jiraTitle);

        const newBranchLine = this.getBranchLine(jiraNumber, jiraTitle);
        const gitPush = this.getGitPushLine(jiraNumber, jiraTitle);

        console.log('jiraNumber', jiraNumber, popupJiraNumber, fullPageJiraNumber);

        if(jiraNumber) {
          this.setState({currentItem: {currentUrl, jiraNumber, newBranchLine, jiraTitle , gitPush, canary}, invalid: false});
        }

      });
    });

  };

  selectAll = () => {
    document.execCommand('selectall', null, false);
    document.execCommand('copy');
  };

  updateNewBranch = (e) => {
    const currentItem = this.state.currentItem;
    currentItem.newBranchLine = e.target.value;
    this.setState({currentItem});
  };

  updateTitle = (e) => {
    const currentItem = this.state.currentItem;
    const selectedCookieName = this.state.selectedCookieName;

    currentItem.jiraTitle = e.target.value;
    currentItem.newBranchLine = this.getBranchLine(currentItem.jiraNumber, e.target.value);
    currentItem.gitPush = this.getGitPushLine(currentItem.jiraNumber, e.target.value);
    currentItem.canary = this.getCanary(currentItem.jiraNumber, e.target.value);
    currentItem.canaryCookie = this.getCanaryCookie(currentItem.jiraNumber, e.target.value, selectedCookieName);
    this.setState({currentItem});
  };

  updateCanary = (e) => {
    const currentItem = this.state.currentItem;
    const selectedCookieName = this.state.selectedCookieName;
    currentItem.canary = e.target.value;

    currentItem.canaryCookie = this.getCanaryCookie(currentItem.jiraNumber, e.target.value, selectedCookieName);
    this.setState({currentItem});
  };

  updateCookieName = (e) => {
    const selectedCookieName = e.target.value;

    const currentItem = this.state.currentItem;
    currentItem.canaryName = e.target.value;
    currentItem.canaryCookie = this.getCanaryCookie(currentItem.jiraNumber, currentItem.canary, selectedCookieName);
    this.setState({currentItem, selectedCookieName});
    this.forceRepaint();
  };

  forceRepaint = () => {
    const root = document.querySelector('#root');
    root.style.display='none';
    root.offsetHeight;
    root.style.display='block';
  };

  openOptions = () => {
    window.open(chrome.runtime.getURL('options.html'));
  };

  saveItem = () => {
    let savedItems = this.state.savedItems;
    const currentItem = this.state.currentItem;

    const existingItem = savedItems.find(savedItem => currentItem.index === savedItem.index);

    if(existingItem) {
      savedItems = savedItems.map((savedItem) => {
        if(currentItem.index === savedItem.index) {
          return {
            ...savedItem,
            ...currentItem
          };
        } else {
          return savedItem;
        }
      }, []);
    } else {
      // TODO: rename index to key or ID
      savedItems.unshift({...this.state.currentItem, index: currentItem.jiraNumber + Math.floor((Math.random()*100))});
    }

    this.setState({savedItems});
    chrome.storage.sync.set({ savedItems });
  };

  openJira = (item) => {
    window.open(item.currentUrl,'_newtab');
  };

  loadItem = (item) => {
    this.setState({currentItem :item, invalid: false });
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  deleteItem = (e, item) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you wish to delete ${item.jiraTitle}?`)) {
      const savedItems = this.state.savedItems;

      const updatedArray = savedItems.reduce((acc, savedItem) => {
        if(item.index !== savedItem.index) {
          acc.unshift(savedItem);
        }
        return acc;
      }, []);

      this.setState({savedItems: updatedArray});

      chrome.storage.sync.set({ savedItems: updatedArray });
    }
  };


  render() {
    const {savedItems, currentItem, invalid, canaryNames, enableGitPush, enableCanary} = this.state;
    const {jiraNumber, newBranchLine, jiraTitle, gitPush, canary, canaryCookie} = currentItem;

    return (
      <div className="popup">
        <div className="header">
          <div className="left">
            <span className={'title-icon'}>
              <iron-icon icon="pets"></iron-icon>
            </span>
            <span className={'title'}>Snow dog</span>
          </div>
          <div className={'center'}>
            <input className={'popup-input-jira-ticket'} type="text" value={jiraNumber} onClick={this.selectAll} />
          </div>
          <div className={'right'}>
            <paper-button toggles class="settings" onClick={this.openOptions}>
              <iron-icon icon="settings"></iron-icon>
            </paper-button>
          </div>
        </div>

        <div>
          <label className={'popup-label'}>Git Branch name (editable)</label>
          <input className={'popup-input'} type="text" value={jiraTitle} onChange={this.updateTitle} />
          <label className={'popup-label'}>Git checkout command</label>
          <input className={'popup-input'} type="text" value={newBranchLine} onChange={this.updateNewBranch} onClick={this.selectAll}/>

          {enableGitPush && (
            <>
            <label className={'popup-label'}>Git push command</label>
            <input className={'popup-input'} type="text" value={gitPush} onClick={this.selectAll}/>
            </>
          )}

          {enableCanary && (
            <>
              <label className={'popup-label'}>Canary Build</label>
              <input className={'popup-input'} type="text" value={canary} onChange={this.updateCanary} />

              <div className={'canary-cookie-title-wrapper'}>
                <label className={'popup-label'}>Canary cookie</label>
                <select name="cookieNames" onChange={e => this.updateCookieName(e)}>
                  <option value="">Choose Cookie name...</option>
                  {canaryNames.map(canaryName =>
                    <option value={canaryName.name} selected={currentItem.canaryName === canaryName.name}>{canaryName.name}</option>
                  )}
                </select>
              </div>
              <input className={'popup-input'} type="text" value={canaryCookie} onClick={this.selectAll}/>
            </>
          )}

          <br />
          <br />

          {invalid && (
            <div>
              <paper-button class="plain-disabled" disabled>Open Jira</paper-button>
              <paper-button class="save-disabled" disabled>Save</paper-button>
            </div>
          )}

          {!invalid && (
            <div>
              <paper-button class="plain" onClick={() => this.openJira(currentItem)}>Open Jira</paper-button>
              <paper-button class="save" onClick={this.saveItem}>Save</paper-button>
            </div>
          )}

          <div className={'saved-items-title'}>Saved Tickets</div>
          <div className={'saved-items-container'}>
            {
              savedItems.map(item => {
                return (
                  <div className={item.index === currentItem.index ? 'saved-item-selected' : 'saved-item'} onClick={() => this.loadItem(item)}>
                    <span className={'saved-items-jiraNumber'}>{item.jiraNumber}</span>
                    <span className={'saved-items-jiraTitle'}>{item.jiraTitle}</span>
                    <span className={'saved-items-actions'}>
                      <button className={'saved-items-open'} onClick={() => this.openJira(item)}>
                        http:
                      </button>
                      <button className={'saved-items-delete'} onClick={e => this.deleteItem(e, item)}>
                        <iron-icon icon="delete"></iron-icon>
                      </button>
                    </span>
                  </div>
                );
              })
            }
          </div>
        </div>
        
      </div>
    );
  }
}


export default Popup;
