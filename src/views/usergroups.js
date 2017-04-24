//@flow
import React from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import CardCarousel from '../components/CardCarousel/CardCarousel';
//var debug = require('../services/debug')('usermaps');
import cardUtil from '../services/card-util';
import MapHubsComponent from '../components/MapHubsComponent';
import Reflux from '../components/Rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class UserGroups extends MapHubsComponent {

  props: {
		groups: Array<Object>,
    user: Object,
    canEdit: boolean,
    locale: string,
    _csrf: string,
    footerConfig: Object
  }

  static defaultProps = {
    groups: [],
    user: {},
    canEdit: false
  }

  constructor(props: Object) {
    super(props);
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf});
  }

	render() {

    var addButton = '', message='';
    if(this.props.canEdit){
      addButton=(
        <div>
          <div className="fixed-action-btn action-button-bottom-right tooltipped" data-position="top" data-delay="50" data-tooltip={this.__('Create New Group')}>
            <a href="/creategroup" className="btn-floating btn-large red red-text">
              <i className="large material-icons">add</i>
            </a>
          </div>
        </div>
      );

      message = (
        <h4>{this.__('My Groups')}</h4>
      );
    }else{
      message = (
        <h4>{this.__('Groups for user: ' + this.props.user.display_name)}</h4>
      );
    }

    var groups = '';
    if(this.props.groups && this.props.groups.length > 0){
      var cards = this.props.groups.map(cardUtil.getGroupCard);
      groups = (
        <div className="row">
          <div className="col s12 no-padding">
            <CardCarousel infinite={false} cards={cards} />
          </div>
        </div>
      );
    }else{
    groups = (
      <div className="row" style={{height: 'calc(100% - 100px)'}}>
        <div className="valign-wrapper" style={{height: '100%'}}>
          <div className="valign align-center center-align" style={{width: '100%'}}>
            <h5>{this.__('Click the button below to create your first group')}</h5>
          </div>
        </div>
      </div>
    );
  }
		return (
      <div>
        <Header/>
        <main style={{marginLeft: '10px', marginRight:'10px'}}>
          {message}
          {groups}
          {addButton}
        </main>
        <Footer {...this.props.footerConfig}/>
      </div>
		);
	}
}