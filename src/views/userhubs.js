//@flow
import React from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import CardCarousel from '../components/CardCarousel/CardCarousel';
//var debug = require('../services/debug')('usermaps');
var cardUtil = require('../services/card-util');

import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class UserHubs extends MapHubsComponent {

  propTypes: {
		draftHubs: Array<Object>,
    publishedHubs: Array<Object>,
    user: Object,
    canEdit: boolean,
    locale: string,
    footerConfig: Object
  }

  static defaultProps: {
    draftHubs: [],
    publishedHubs: [],
    user: {},
    canEdit: false
  }

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }

	render() {

    var addButton = '', hubsMessage = '';
    if(this.props.canEdit){
      addButton=(
        <div>
          <div className="fixed-action-btn action-button-bottom-right tooltipped" data-position="top" data-delay="50" data-tooltip={this.__('Create New Hub')}>
            <a href="/createhub" className="btn-floating btn-large red red-text">
              <i className="large material-icons">add</i>
            </a>
          </div>
        </div>
      );

      hubsMessage = (
        <h4>{this.__('My Hubs')}</h4>
      );
    }else{
      hubsMessage = (
        <h4>{this.__('Hubs for user: ' + this.props.user.display_name)}</h4>
      );
    }

    var draftHubs = '', hasDrafts = false;
    if(this.props.draftHubs && this.props.draftHubs.length > 0){
      var draftCards = this.props.draftHubs.map(cardUtil.getHubCard);
      draftHubs = (
        <div className="row">
          <div className="col s12 no-padding">
            <h5>{this.__('Draft Hubs')}</h5>
            <CardCarousel infinite={false} cards={draftCards} />
          </div>
        </div>
      );
      hasDrafts = true;
    }

  var publishedHubs = '', emptyMessage = '', divider='', hasPubished = false;
  if(this.props.publishedHubs && this.props.publishedHubs.length > 0){
    var publishedCards = this.props.publishedHubs.map(cardUtil.getHubCard);
    publishedHubs = (
      <div className="row">
        <div className="col s12 no-padding">
          <h5>{this.__('Published Hubs')}</h5>
          <CardCarousel infinite={false} cards={publishedCards} />
        </div>
      </div>
    );
    if(hasDrafts){
      divider = (
        <div className="divider" />
      );
    }
    hasPubished = true;
  }else if(!hasDrafts && !hasPubished){
    emptyMessage = (
      <div className="row" style={{height: 'calc(100% - 100px)'}}>
        <div className="valign-wrapper" style={{height: '100%'}}>
          <div className="valign align-center center-align" style={{width: '100%'}}>
            <h5>{this.__('Click the button below to create your first hub')}</h5>
          </div>
        </div>
      </div>
    );
  }
		return (
      <div>
        <Header/>
        <main style={{marginLeft: '10px', marginRight:'10px'}}>
          {hubsMessage}
          {draftHubs}
          {divider}
          {publishedHubs}
          {emptyMessage}
          {addButton}
        </main>
        <Footer {...this.props.footerConfig}/>
      </div>
		);
	}
}