// @flow
import React from 'react';
import Header from '../components/header';
import Footer from '../components/footer';
import CardCarousel from '../components/CardCarousel/CardCarousel';
import StorySummary from '../components/Story/StorySummary';

import Carousel from 'nuka-carousel';
import SliderDecorators from '../components/Home/SliderDecorators';

import OnboardingLinks from '../components/Home/OnboardingLinks';
import MapHubsProLinks from '../components/Home/MapHubsProLinks';
import MailingList from '../components/Home/MailingList';
//var HomePageMap = require('../components/Home/HomePageMap');
var _shuffle = require('lodash.shuffle');
var cardUtil = require('../services/card-util');

import MapHubsComponent from '../components/MapHubsComponent';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';
import LocaleActions from '../actions/LocaleActions';

export default class Home extends MapHubsComponent {

  props: {
    trendingLayers: Array<Object>,
    trendingGroups: Array<Object>,
    trendingHubs: Array<Object>,
    trendingMaps: Array<Object>,
    trendingStories: Array<Object>,
    featuredStories:  Array<Object>,
    locale: string,
    _csrf: string,
    mapHub: Object,
    mapHubLayers: Array<Object>,
    footerConfig: Object
  }

  constructor(props: Object){
		super(props);
    this.state = {
      trendingStoryCards: _shuffle(this.props.trendingStories.map(cardUtil.getStoryCard)),
      trendingMapCards: _shuffle(this.props.trendingMaps.map(cardUtil.getMapCard)),
      trendingHubCards: _shuffle(this.props.trendingHubs.map(cardUtil.getHubCard)),
      trendingGroupCards: _shuffle(this.props.trendingGroups.map(cardUtil.getGroupCard)),
      trendingLayerCards: _shuffle(this.props.trendingLayers.map(cardUtil.getLayerCard))
    };
	}

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }

  handleSearch(input: string){
    window.location = '/search?q=' + input;
  }

	render() {

    var trendingCards = cardUtil.combineCards([this.state.trendingLayerCards,
    this.state.trendingGroupCards,
    this.state.trendingHubCards,
    this.state.trendingMapCards,
    this.state.trendingStoryCards]);

     //TODO: move this to a config inside the theme
     var slides = [
       {
         title: this.__('MapHubs is now Map for Environment'),
         text: this.__('We have merged MapHubs with Map for Environment'),
         buttonText: this.__('Learn More'),
         link: 'https://mapforenvironment.org/user/map4env/story/61/MapHubs-is-now-Map-for-Environment',
         img: '/assets/home/Moabi–Chameleon.jpg'
       },
       {
         title: this.__('Mapping for Everyone'),
         text: MAPHUBS_CONFIG.productName + ' ' + this.__('is a home for the world\'s open map data and an easy tool for making maps'),
         buttonText: this.__('Learn More'),
         link: '/about',
         img: '/assets/home/Moabi-Aerial.jpg'
       },
       {
         title: this.__('Maps for Journalists'),
         text: this.__('Tell Your Story with Maps'),
         buttonText: this.__('Learn More'),
         link: '/journalists',
         img: '/assets/home/Moabi-Canoe.jpg'
       },
       {
         title: this.__('OpenStreetMap'),
         text: this.__('Help us make maps to monitor the world’s natural resources.'),
         buttonText: this.__('Learn More'),
         link: 'https://osm.mapforenvironment.org',
         img: '/assets/home/m4e_osm_banner.jpg'
       },
       {
         title: this.__('Explore Maps'),
         text: MAPHUBS_CONFIG.productName + ' ' + this.__('has map layers for environment, natural resources, and development'),
         buttonText: this.__('Explore Maps'),
         link: '/explore',
         img: '/assets/home/MapHubs-Map.jpg'
       },
       {
         title: MAPHUBS_CONFIG.productName + ' ' + this.__('Services'),
         text: this.__('We offer a range of service to help you get mapping'),
         buttonText: this.__('Learn More'),
         link: '/services',
         img: '/assets/home/Moabi-Forest.jpg'
       }
     ];

     var homePageCarousel = '', proLinks = '', mailingList = '', homepageMap= '';
     if(MAPHUBS_CONFIG.homepageProLinks){
       proLinks = (
         <div className="row">
          <MapHubsProLinks />
        </div>
       );
     }
     if(MAPHUBS_CONFIG.homepageSlides){
       homePageCarousel = (
         <div className="row" style={{marginTop: 0, marginBottom: 0, height: '70%', maxHeight:'600px'}}>
           <Carousel autoplay={true} slidesToShow={1} autoplayInterval={5000} wrapAround={true}
             decorators={SliderDecorators}>
             {slides.map(function(slide, i){
               return (
                 <div key={i} className="homepage-slide responsive-img valign-wrapper"
                   style={{
                     height: '100%',
                     backgroundSize: 'cover',
                     backgroundImage: 'url('+ slide.img + ')'
                   }}>
                   <div className="slide-text">
                     <h2 className="no-margin">{slide.title}</h2>
                     <h3 className="no-margin">{slide.text}</h3>
                   </div>
                   <div className="slide-button center">
                     <a className="btn waves-effect z-depth-3" style={{borderRadius: '25px'}} href={slide.link}>{slide.buttonText}</a>
                   </div>
                </div>
              );
             })}
           </Carousel>

         </div>
       );
     
     }
     if(MAPHUBS_CONFIG.homepageMailingList){
        mailingList = (
         <MailingList />
       );
     }
     /*
     if(MAPHUBS_CONFIG.homepageMapHubId && this.props.mapHub){
       homepageMap = (
         <div className="row no-margin" style={{height: 'calc(100vh - 150px)'}}>
            <HomePageMap height="100%" hub={this.props.mapHub} layers={this.props.mapHubLayers}/>
            <div className="divider" />
          </div>
       );
     }
     */

     var featured = '';
     if(this.props.featuredStories && this.props.featuredStories.length > 0){
       featured = (
         <div>
           <div className="divider" />
           <div className="row">
             <h5 className="no-margin center-align" style={{lineHeight: '50px', color: '#212121'}}>
               {this.__('Featured Stories')}
             </h5>
               {this.props.featuredStories.map(function (story) {
                 return (
                   <div className="card" key={story.story_id} style={{maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto'}}>
                     <div className="card-content">
                     <StorySummary story={story} />
                     </div>
                   </div>
                 );
               })}
           </div>
         </div>
       );
     }

		return (
      <div style={{margin: 0, height: '100%'}}>
      <Header />
      <main style={{margin: 0, height: '100%'}}>
        {homePageCarousel}
        {homepageMap}
        {mailingList}
         <div className="row">
          <OnboardingLinks />
        </div>
        {proLinks}
        <div className="divider" />
         <div className="row" style={{marginBottom: '50px'}}>
           <div className="row no-margin" style={{height: '50px'}}>
             <div>
                <h5 className="no-margin center-align" style={{lineHeight: '50px', color: '#212121'}}>
                  {this.__('Trending')}
                  <i className="material-icons" style={{fontWeight: 'bold', color: MAPHUBS_CONFIG.primaryColor, fontSize:'40px', verticalAlign: '-25%', marginLeft: '5px'}}>trending_up</i>
                </h5>
             </div>
           </div>
           <div className="row">
             <div className="col s12">
               <CardCarousel cards={trendingCards} infinite={false}/>
             </div>
           </div>
          </div>
            {featured}
          <Footer {...this.props.footerConfig}/>
       </main>

			</div>
		);
	}
}