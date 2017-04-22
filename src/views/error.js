//@flow
import React from 'react';
import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Header from '../components/header';
import Footer from '../components/footer';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class Error extends MapHubsComponent {

  props: {
    title: string,
		error: string,
		url: string,
    locale: string,
    _csrf: string,
    footerConfig: Object
  }

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }
  
  render() {
    return (
      <div>
        <Header />
        <main>
          <div className="container s12">
            <h3 className="center-align">{this.props.title}</h3>
            <p className="flow-text center-align">{this.props.error}</p>
            <p className="flow-text center-align"><a href={this.props.url} target="_blank">{this.props.url}</a></p>
          </div>
        </main>
        <Footer {...this.props.footerConfig}/>
      </div>
    );
  }
}