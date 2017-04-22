// @flow
import React from 'react';
var urlUtil = require('../services/url-util');

import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class OAuthDialog extends MapHubsComponent {

  props: {
    locale: string,
    _csrf: string,
    user: string,
    client: string,
    transactionID: string
  }

  static defaultProps: {
    user: 'Unknown',
    client: 'Unknown',
    transactionID: ''
  }

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }

  render() {
    var baseUrl = urlUtil.getBaseUrl();
    var callbackUrl = baseUrl + '/edit/land.html';
    return (
      <div className="container">
        <p>Hi {this.props.user}!</p>
        <p><b>{this.props.client}</b> {this.__('is requesting access to your account')}</p>
        <p>{this.__('Do you approve?')}</p>

        <form action="/dialog/authorize/decision" method="post">
          <input name="transaction_id" type="hidden" value={this.props.transactionID}/>
          <input type="hidden" name="oauth_callback" id="oauth_callback" value={callbackUrl} />
          <div>
            <input type="submit" value="Allow" id="allow"/>
            <input type="submit" value="Deny" name="cancel" id="deny"/>
          </div>
        </form>

      </div>
    );
  }
}