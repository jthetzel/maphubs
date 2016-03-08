var React = require('react');
var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux);
var LocaleStore = require('../stores/LocaleStore');
var Locales = require('../services/locales');

var Footer = React.createClass({

  mixins:[StateMixin.connect(LocaleStore)],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  render() {

    return (
        <footer className="page-footer white">
          <div className="divider"></div>
          <div className="container">

            <div className="row">
              <div className="col l6 s12" style={{marginTop: '15px'}}>
                <a href="http://moabi.org">
                  <img width="50" height="50" className="responsive-img" style={{marginLeft: '-10px'}} src="/assets/moabi-logo.png" alt="Moabi.org" /></a>
                  <br />
                  <small>{this.__('MapHubs is a Moabi project')}</small>
                  <br />
                  <small>{this.__('MapHubs is Open Source, the code is available on ')}<a href="https://github.com/maphubs">GitHub</a></small>

              </div>
              <div className="col l4 offset-l2 s12">
                <ul>
                  <li><a className="text-darken-3 center" href="/about">About MapHubs</a></li>
                  <li>Contact Us: <a className="text-darken-3 center" href="mailto:info@maphubs.com">info@maphubs.com</a></li>
                  <li>Twitter: <a className="text-darken-3 center" href="http://twitter.com/maphubs">@maphubs</a></li>
                  <li><a className="text-darken-3 center" href="/terms">Terms</a></li>
                  <li><a className="text-darken-3 center" href="/privacy">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-copyright white">
            <div className="grey-text container center">
              <small>&copy; 2016 MapHubs</small>
            </div>
          </div>

      </footer>
    );
  }
});

module.exports = Footer;
