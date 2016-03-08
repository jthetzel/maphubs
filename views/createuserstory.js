var React = require('react');
var Header = require('../components/header');
var StoryEditor = require('../components/Story/StoryEditor');

var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux);
var LocaleStore = require('../stores/LocaleStore');
var Locales = require('../services/locales');

var CreateUserStory = React.createClass({

  mixins:[StateMixin.connect(LocaleStore, {initWithProps: ['locale']})],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  propTypes: {
    username: React.PropTypes.string.isRequired,
    locale: React.PropTypes.string.isRequired
  },

  render() {
    return (
      <div>
        <Header />
        <main>
          <StoryEditor storyType="user" username={this.props.username}/>
        </main>

      </div>
    );
  }
});

module.exports = CreateUserStory;