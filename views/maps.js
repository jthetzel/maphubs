var React = require('react');

var Header = require('../components/header');
var Footer = require('../components/footer');
var SearchBox = require('../components/SearchBox');
var CardCarousel = require('../components/CardCarousel/CardCarousel');
var debug = require('../services/debug')('views/maps');
var config = require('../clientconfig');
var urlUtil = require('../services/url-util');
var request = require('superagent');
var checkClientError = require('../services/client-error-response').checkClientError;
var MessageActions = require('../actions/MessageActions');
var NotificationActions = require('../actions/NotificationActions');

var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux);
var LocaleStore = require('../stores/LocaleStore');
var UserStore = require('../stores/UserStore');
var Locales = require('../services/locales');

var Maps = React.createClass({

  mixins:[StateMixin.connect(UserStore), StateMixin.connect(LocaleStore, {initWithProps: ['locale']})],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  propTypes: {
    featuredMaps: React.PropTypes.array,
    recentMaps: React.PropTypes.array,
    popularMaps: React.PropTypes.array,
    locale: React.PropTypes.string.isRequired
  },

  getDefaultProps() {
    return {
    };
  },

  getInitialState(){
    return {
      searchResults: [],
      searchActive: false
    };
  },

  handleSearch(input) {
    var _this = this;
    debug('searching for: ' + input);
    request.get(urlUtil.getBaseUrl(config.host, config.port) + '/api/maps/search?q=' + input)
    .type('json').accept('json')
    .end(function(err, res){
      checkClientError(res, err, function(err){
        if(err){
          MessageActions.showMessage({title: 'Error', message: err});
        }else{
          if(res.body.maps && res.body.maps.length > 0){
            _this.setState({searchActive: true, searchResults: res.body.maps});
            NotificationActions.showNotification({message: res.body.maps.length + ' ' + _this.__('Results'), position: 'bottomleft'});
          }else{
            //show error message
            NotificationActions.showNotification({message: _this.__('No Results Found'), dismissAfter: 5000, position: 'bottomleft'});
          }
        }
      },
      function(cb){
        cb();
      }
      );
    });
  },

  resetSearch(){
    this.setState({searchActive: false, searchResults: []});
  },

  onCreateMap(){
    if(this.state.user.display_name){
      window.location= '/user/' + this.state.user.display_name + '/maps';
    }else{
      MessageActions.showMessage({title: 'Login Required', message: this.__('Please login to your account or register for an account.')});
    }
  },

	render() {

    var featuredCards = [];
    var recentCards = [];
    var popularCards = [];

    this.props.featuredMaps.map(function(map){
      var image_url = '/api/screenshot/map/thumbnail/' + map.map_id + '.png';

      featuredCards.push({
        id: map.map_id,
        title: map.title ? map.title : '',
        image_url,
        link: '/user/' + map.username + '/map/' + map.map_id,
        type: 'map',
        map
      });
    });

    this.props.recentMaps.map(function(map){
      var image_url = '/api/screenshot/map/thumbnail/' + map.map_id + '.png';

      recentCards.push({
        id: map.map_id,
        title: map.title ? map.title : '',
        image_url,
        link: '/user/' + map.username + '/map/' + map.map_id,
        type: 'map',
        map
      });
    });

    this.props.popularMaps.map(function(map){
      var image_url = '/api/screenshot/map/thumbnail/' + map.map_id + '.png';

      popularCards.push({
        id: map.map_id,
        title: map.title ? map.title : '',
        image_url,
        link: '/user/' + map.username + '/map/' + map.map_id,
        type: 'map',
        map
      });
    });

    var searchResults = '';
    var searchCards = [];
    if(this.state.searchActive){
      if(this.state.searchResults.length > 0){


        this.state.searchResults.map(function(map){
          var image_url = '/api/screenshot/map/thumbnail/' + map.map_id + '.png';

          searchCards.push({
            id: map.map_id,
            title: map.title ? map.title : '',
            image_url,
            link: '/user/' + map.username + '/map/' + map.map_id,
            type: 'map',
            map
          });
        });
        searchResults = (
          <div className="row">
            <div className="col s12">
            <h5>{this.__('Search Results')}</h5>
            <div className="divider"></div>
            <CardCarousel infinite={false} cards={searchCards}/>
          </div>
          </div>
        );
      }
      else {
        searchResults = (
          <div className="row">
            <div className="col s12">
            <h5>{this.__('Search Results')}</h5>
            <div className="divider"></div>
            <p><b>{this.__('No Results Found')}</b></p>
          </div>
          </div>
        );
      }

    }


		return (
      <div>
        <Header activePage="maps" />
        <main>
          <div style={{marginTop: '20px', marginBottom: '10px'}}>
            <div className="row" style={{marginBottom: '0px'}}>
              <div className="col l8 m7 s12">
                <p style={{fontSize: '16px', margin: 0}}>{this.__('Browse maps or create a new map using MapHubs\' respository of open map layers.')}</p>
              </div>
              <div className="col l3 m4 s12 right" style={{paddingRight: '15px'}}>
                <SearchBox label={this.__('Search Maps')} suggestionUrl="/api/maps/search/suggestions" onSearch={this.handleSearch} onReset={this.resetSearch}/>
              </div>
            </div>
          </div>
          {searchResults}
          <div className="row">
            <div className="col s12">
              <h5>{this.__('Featured')}</h5>
              <div className="divider"></div>
              <CardCarousel cards={featuredCards} infinite={false}/>
            </div>
          </div>
          <div className="row">
            <div className="col s12">
              <h5>{this.__('Popular')}</h5>
              <div className="divider"></div>
              <CardCarousel cards={popularCards} infinite={false}/>
            </div>
          </div>
          <div className="row">
            <div className="col s12">
              <h5>{this.__('Recent')}</h5>
              <div className="divider"></div>
              <CardCarousel cards={recentCards} infinite={false}/>
            </div>
          </div>

          <div>
            <div className="fixed-action-btn action-button-bottom-right tooltipped" data-position="top" data-delay="50" data-tooltip={this.__('Create New Map')}>
              <a onClick={this.onCreateMap} className="btn-floating btn-large red">
                <i className="large material-icons">add</i>
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
		);
	}
});
module.exports = Maps;
