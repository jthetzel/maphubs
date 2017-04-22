//@flow
import React from 'react';
import Header from '../components/header';
import ReactDisqusThread from 'react-disqus-thread';
var slug = require('slug');
import StoryHeader from '../components/Story/StoryHeader';
import MapHubsComponent from '../components/MapHubsComponent';
import LocaleActions from '../actions/LocaleActions';
import Rehydrate from 'reflux-rehydrate';
import LocaleStore from '../stores/LocaleStore';

export default class UserStory extends MapHubsComponent {

  propTypes: {
    story: Object,
    username: string,
    canEdit: boolean,
    locale: string
  }

  static defaultProps: {
    story: {},
    canEdit: false
  }

  componentWillMount() {
    Rehydrate.initStore(LocaleStore);
    LocaleActions.rehydrate({locale: this.props.locale, _csrf: this.props._csrf});
  }

  render() {
    var story = this.props.story;

    var button = '';
    if(this.props.canEdit){
      button = (
        <div className="fixed-action-btn action-button-bottom-right">
          <a className="btn-floating btn-large red red-text tooltipped"
            href={'/user/'+ this.props.username + '/story/' + this.props.story.story_id + '/edit/' + slug(this.props.story.title)}
            data-delay="50" data-position="left" data-tooltip={this.__('Edit')}>
            <i className="large material-icons">mode_edit</i>
          </a>

        </div>
      );
    }
    var title = story.title.replace('&nbsp;', '');

    var shareAndDiscuss = '';
    if(!MAPHUBS_CONFIG.mapHubsPro){
      shareAndDiscuss = (
        <div className="row">
          <div className="addthis_sharing_toolbox"></div>
          <ReactDisqusThread
                shortname="maphubs"
                identifier={'maphubs-story-' + story.story_id}
                title={title}
                />
        </div>
      );
    }

    /*eslint-disable react/no-danger*/
    return (
      <div>
        <Header />
        <main>
          <div className="container">
            <div className="row" style={{marginTop: '20px'}}>
              <div className="col s12 m19 l9">
                <StoryHeader story={story} />
              </div>
              <div className="col s12 m3 l3">
                <div className="addthis_sharing_toolbox right"></div>
              </div>
            </div>
            <div className="row">
              <h3 className="story-title">{title}</h3>
              <div className="story-content" dangerouslySetInnerHTML={{__html: story.body}}></div>
            </div>
              <hr />
              {shareAndDiscuss}

              </div>
          {button}
        </main>
      </div>
    );
      /*eslint-enable react/no-danger*/
  }
}