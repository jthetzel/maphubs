//@flow
import React from 'react';
import isEmpty from 'lodash.isempty';
import HubBanner from '../components/Hub/HubBanner';
import HubStories from '../components/Hub/HubStories';
import HubNav from '../components/Hub/HubNav';
import HubEditButton from '../components/Hub/HubEditButton';
import HubStore from '../stores/HubStore';
import HubActions from '../actions/HubActions';
import MessageActions from '../actions/MessageActions';
import NotificationActions from '../actions/NotificationActions';
import Notification from '../components/Notification';
import Message from '../components/message';
import Confirmation from '../components/confirmation';
import Footer from '../components/footer';
import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class HubStoriesPage extends MapHubsComponent {

  propTypes: {
    hub: Object,
    stories: Array<Object>,
    canEdit: boolean,
    locale: string,
    footerConfig: Object
  }

  static defaultProps: {
    hub: {
      name: "Unknown"
    },
    stories: [],
    canEdit: false
  }

  state: {
    editing: false
  }

  constructor(props: Object){
		super(props);
    this.stores.push(HubStore);
	}

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    Rehydrate.initStore(HubStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
    HubActions.rehydrate({hub: this.props.hub, stories: this.props.stories});
  }

  startEditing(){
    this.setState({editing: true});
  }

  stopEditing(){
    var _this = this;
    HubActions.saveHub(this.state._csrf, function(err){
      if(err){
        MessageActions.showMessage({title: _this.__('Server Error'), message: err});
      }else{
        NotificationActions.showNotification({message: _this.__('Hub Saved')});
        _this.setState({editing: false});
      }
    });
  }

  publish(){
    var _this = this;
    if(this.state.unsavedChanges){
      MessageActions.showMessage({title: _this.__('Unsaved Changes'), message: _this.__('Please save your changes before publishing.')});
    }else if(isEmpty(this.state.hub.title) || isEmpty(this.state.hub.description)
            || !this.state.hub.hasLogoImage || !this.state.hub.hasBannerImage){
      MessageActions.showMessage({title: _this.__('Required Content'), message: _this.__('Please complete your hub before publishing. Add a title, description, logo image, and banner image. \n We also recommend adding map layers and publishing your first story.')});
    }else {
      HubActions.publish(this.state._csrf, function(err){
        if(err){
          MessageActions.showMessage({title: _this.__('Server Error'), message: err});
        }else{
          NotificationActions.showNotification({message: _this.__('Hub Published')});
        }
      });
    }
  }

  render() {

    var editButton = '';
    var publishButton = '';

    if(this.props.canEdit){
      editButton = (
        <HubEditButton editing={this.state.editing}
          startEditing={this.startEditing.bind(this)} stopEditing={this.stopEditing.bind(this)} />
      );

      if(!this.state.hub.published){
        publishButton = (
          <div className="center center-align" style={{margin: 'auto', position: 'fixed', top: '15px', right: 'calc(50% - 60px)'}}>
            <button className="waves-effect waves-light btn" onClick={this.publish.bind(this)}>{this.__('Publish')}</button>
          </div>
        );
      }
    }

    return (
      <div>
        <HubNav hubid={this.props.hub.hub_id} canEdit={this.props.canEdit}/>
        <main style={{marginTop: '0px'}}>
          {publishButton}
          <div className="row">
            <HubBanner editing={false} hubid={this.props.hub.hub_id} subPage/>
          </div>
          <div className="container">
            <div className="row">
              <HubStories hub={this.props.hub}
                editing={this.state.editing}
                stories={this.props.stories} limit={6}/>
            </div>
          </div>
          {editButton}
          <Footer {...this.props.footerConfig}/>
        </main>
        <Notification />
        <Message />
        <Confirmation />
      </div>
    );
  }
}