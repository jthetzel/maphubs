//@flow
import React from 'react';

var urlUtil = require('../../services/url-util');
var moment = require('moment-timezone');
import Gravatar from '../user/Gravatar';

import {addLocaleData, IntlProvider, FormattedRelative} from 'react-intl';
import en from 'react-intl/locale-data/en';
import es from 'react-intl/locale-data/es';
import fr from 'react-intl/locale-data/fr';

addLocaleData(en);
addLocaleData(es);
addLocaleData(fr);

import MapHubsComponent from '../../components/MapHubsComponent';

export default class MapCardUserTag extends MapHubsComponent {

  props: {
    map: Object
  }

  static defaultProps: {
    baseUrl: ''
  }

  render(){

    var linkUrl = '';
    var author = '';
    var userImage='';
    var guessedTz = moment.tz.guess();
    var updatedTime = moment.tz(this.props.map.updated_at, guessedTz).format();

        userImage = (
            <Gravatar size={36} emailHash={this.props.map.emailhash} />

        );

      var baseUrl = urlUtil.getBaseUrl();
      linkUrl = baseUrl + '/user/' + this.props.map.username;
      author = (
        <div style={{height: '40px', marginBottom: '10px'}}>
          <div className="valign-wrapper" style={{width: '36px', float: 'left'}}>
            <a className="valign" style={{marginTop: '4px'}} href={linkUrl + '/maps'}>{userImage}</a>
          </div>
          <div style={{marginLeft: '46px'}}>
            <p style={{fontSize: '14px', margin: 0, lineHeight: '1.4rem'}} className="truncate"><a className="valign" style={{marginTop: 0, marginBottom: 0, marginLeft: '5px', fontSize: '14px', lineHeight: '1.4rem'}} href={linkUrl + '/maps'}>{this.props.map.username}</a></p>
            <p style={{fontSize: '14px', margin: 0, lineHeight: '1.4rem'}}>
              <IntlProvider locale={this.state.locale}>
                <FormattedRelative value={updatedTime}/>
              </IntlProvider>
            </p>
          </div>
        </div>
      );

   return (
     <div>
       {author}
     </div>
   );
  }
}