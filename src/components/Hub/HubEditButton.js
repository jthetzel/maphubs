//@flow
import React from 'react';
import _isequal from 'lodash.isequal';
import MapHubsComponent from '../../components/MapHubsComponent';

export default class HubEditButton extends MapHubsComponent {

  props: {
    editing: boolean,
    startEditing: Function,
    stopEditing: Function,
    style: Object
  }

  static defaultProps = {
    style: {}
  }

  shouldComponentUpdate(nextProps: Object, nextState: Object){
    //only update if something changes
    if(!_isequal(this.props, nextProps)){
      return true;
    }
    if(!_isequal(this.state, nextState)){
      return true;
    }
    return false;
  }

  render(){var button = '';
  if(this.props.editing){
    button = (
        <a onClick={this.props.stopEditing} className="btn-floating btn-large omh-accent-text">
          <i className="large material-icons">save</i>
        </a>
    );
  }else {
    button = (
        <a onClick={this.props.startEditing} className="btn-floating btn-large omh-accent-text">
          <i className="large material-icons">mode_edit</i>
        </a>
    );
  }
    return (
      <div style={this.props.style} className="fixed-action-btn action-button-bottom-right">
      {button}
      </div>
    );
  }
}