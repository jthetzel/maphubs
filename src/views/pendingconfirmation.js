//#flow
import React from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import MessageActions from '../actions/MessageActions';
import NotificationActions from '../actions/NotificationActions';
import UserActions from '../actions/UserActions';
import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class PendingConfirmation extends MapHubsComponent {

  props: {
    user: Object,
    locale: string,
    footerConfig: Object
  }

  state: {
    canSubmit: false
  }

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }

  onResend(){
    var _this = this;
    UserActions.resendConfirmation(this.state._csrf, function(err){
      if(err){
          MessageActions.showMessage({title: 'Error', message: err});
      }else {
        NotificationActions.showNotification(
          {
            message: _this.__('Confirmation email sent. Please check your email.'),
            position: 'bottomright'
        });
      }
    });
  }

  render() {
    if(this.props.user.email_valid){
      return (
        <div>
          <Header />
          <main className="container">
            <div className="row valign-wrapper">
              <div className="col s12 m8 l8 valign" style={{margin: 'auto'}}>
                <h4 className="center">{this.__('Confirmed')}</h4>
                <p>{this.__('Your account is confirmed')}</p>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div>
        <Header />
        <main className="container">
          <div className="row valign-wrapper">
            <div className="col s12 m8 l8 valign" style={{margin: 'auto'}}>
              <h4 className="center">{this.__('Please Confirm Your Email Address')}</h4>
              <p className="center-align">{this.__('We sent you an email at')} {this.props.user.email}</p>
              <p className="center-align">{this.__('Please click the link in the email to confirm your account')}</p>
              <button
                onClick={this.onResend.bind(this)}
                className="waves-effect waves-light btn valign center"
                style={{marginTop: '25px', marginLeft: 'auto', marginRight: 'auto'}}>
                {this.__('Resend Email')}
              </button>
              <p className="center-align">{this.__('If you are unable to access your account please contact us at ')}<a href="#" onClick={function(){HS.beacon.open();}}>{MAPHUBS_CONFIG.contactEmail}</a></p>
            </div>
          </div>
      </main>
      <Footer {...this.props.footerConfig}/>
      </div>
    );
  }
}