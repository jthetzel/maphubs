//@flow
import React from 'react';
import DataEditorActions from '../../actions/DataEditorActions';
import DataEditorStore from '../../stores/DataEditorStore';
import DataCollectionForm from '../DataCollection/DataCollectionForm';
import _isequal from 'lodash.isequal';
import MapHubsComponent from '../MapHubsComponent';
import MapStyles from '../Map/Styles';
var debug = require('../../services/debug')('editLayerPanel');

type Props = {

}

import type {DataEditorStoreState} from '../../stores/DataEditorStore';

type State = DataEditorStoreState;

export default class EditLayerPanel extends MapHubsComponent<Props, State> {

  constructor(props: Props){
    super(props);
    this.stores.push(DataEditorStore);
  }

  onChange = (data: Object) => {
    //don't fire change if this update came from state (e.g. undo/redo)
    //the geojson may have tags not in the presets so we need to ignore them when checking for changes
    var foundChange;
    if(this.state.selectedEditFeature && this.state.selectedEditFeature.geojson){
      let properties = this.state.selectedEditFeature.geojson.properties;
      Object.keys(data).map(key =>{
      if(!_isequal(data[key], properties[key]))
        foundChange = true;
      });
      if(foundChange){   
        DataEditorActions.updateSelectedFeatureTags(data);
      }
    }else{
      debug.log('missing geoJSON');
    }
  }

  render(){
    //var canSave = this.state.edits.length > 0;
    var feature = this.state.selectedEditFeature;

    var layerTitle = '';
    if(this.state.editingLayer){
      let name = this.state.editingLayer.name;
      layerTitle = (
        <p className="word-wrap" style={{paddingTop: '2px', paddingLeft: '2px', paddingRight: '2px', paddingBottom: '5px'}}>
          <b>{this.__('Editing:')}</b> {this._o_(name)}
        </p>
      );
    }

    var featureAttributes = '';
    if(feature && this.state.editingLayer && this.state.editingLayer.style){
      let firstSource = Object.keys(this.state.editingLayer.style.sources)[0];
      let presets = MapStyles.settings.getSourceSetting(this.state.editingLayer.style, firstSource, 'presets');


      featureAttributes = (
        <DataCollectionForm presets={presets} 
          values={feature.geojson.properties}
          onChange={this.onChange}
          showSubmit={false} />
      );
    }

    return (
      <div>
        {layerTitle}
        {featureAttributes}
      </div>
    );   
  }
}