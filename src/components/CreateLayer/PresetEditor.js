
import React from 'react';
import PropTypes from 'prop-types';
import Reflux from 'reflux';
var PresetForm = require('./PresetForm');

var PresetStore = require('../../stores/preset-store');
var actions = require('../../actions/presetActions');
var StateMixin = require('reflux-state-mixin')(Reflux);
var LocaleStore = require('../../stores/LocaleStore');
var Locales = require('../../services/locales');

var PresetEditor = React.createClass({

  mixins: [
    Reflux.connect(PresetStore, 'store'),
    StateMixin.connect(LocaleStore)
  ],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  propTypes: {
    onValid: PropTypes.func,
    onInvalid: PropTypes.func,
    warnIfUnsaved: PropTypes.bool
  },

  getDefaultProps(){
    return {
      warnIfUnsaved: true
    };
  },

  componentDidMount(){
    var _this = this;
    window.onbeforeunload = function(){
      if(_this.props.warnIfUnsaved && _this.state.store.pendingChanges){
        return _this.__('You have not saved your edits, your changes will be lost.');
      }
    };
  },

  addPreset(){
    actions.addPreset();
  },

  onValid(){
    if(this.props.onValid) this.props.onValid();
  },

  onInvalid(){
    if(this.props.onInvalid) this.props.onInvalid();
  },

	render() {
    var _this = this;
    var presets = [];
    if(this.state.store && Array.isArray(this.state.store.presets)){
      presets = this.state.store.presets;
    }
		return (
        <div>
          <div className="row no-padding">
            <div className="left">
              <a className="waves-effect waves-light btn" onClick={this.addPreset}><i className="material-icons right">add</i>{this.__('Add Field')}</a>
            </div>
          </div>
          <ul className="collection">
            {
                presets.map(function(preset){
                  return(
                   <li key={preset.id} className="collection-item attribute-collection-item">
                       <PresetForm ref={preset.tag} {...preset}
                         onValid={_this.onValid}
                         onInvalid={_this.onInvalid}
                         />
                     </li>
                   );
                })
            }
          </ul>
      </div>
		);
	}
});

module.exports = PresetEditor;
