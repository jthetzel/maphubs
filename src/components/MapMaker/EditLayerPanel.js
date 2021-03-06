// @flow
import React from 'react'
import DataEditorActions from '../../actions/DataEditorActions'
import DataEditorStore from '../../stores/DataEditorStore'
import DataCollectionForm from '../DataCollection/DataCollectionForm'
import _isequal from 'lodash.isequal'
import MapHubsComponent from '../MapHubsComponent'
import MapStyles from '../Map/Styles'
import type {DataEditorStoreState} from '../../stores/DataEditorStore'

const debug = require('../../services/debug')('editLayerPanel')

type Props = {

}

type State = DataEditorStoreState;

export default class EditLayerPanel extends MapHubsComponent<Props, State> {
  constructor (props: Props) {
    super(props)
    this.stores.push(DataEditorStore)
  }

  onChange = (data: Object) => {
    // don't fire change if this update came from state (e.g. undo/redo)
    // the geojson may have tags not in the presets so we need to ignore them when checking for changes
    let foundChange
    if (this.state.selectedEditFeature && this.state.selectedEditFeature.geojson) {
      const properties = this.state.selectedEditFeature.geojson.properties
      Object.keys(data).map(key => {
        if (!_isequal(data[key], properties[key])) { foundChange = true }
      })
      if (foundChange) {
        DataEditorActions.updateSelectedFeatureTags(data)
      }
    } else {
      debug.log('missing geoJSON')
    }
  }

  render () {
    // var canSave = this.state.edits.length > 0;
    const feature = this.state.selectedEditFeature

    let layerTitle = ''
    if (this.state.editingLayer) {
      const name = this.state.editingLayer.name
      layerTitle = (
        <p className='word-wrap' style={{paddingTop: '2px', paddingLeft: '2px', paddingRight: '2px', paddingBottom: '5px'}}>
          <b>{this.__('Editing:')}</b> {this._o_(name)}
        </p>
      )
    }

    let featureAttributes = ''
    if (feature && this.state.editingLayer && this.state.editingLayer.style) {
      const firstSource = Object.keys(this.state.editingLayer.style.sources)[0]
      const presets = MapStyles.settings.getSourceSetting(this.state.editingLayer.style, firstSource, 'presets')

      featureAttributes = (
        <DataCollectionForm presets={presets}
          values={feature.geojson.properties}
          onChange={this.onChange}
          showSubmit={false} />
      )
    }

    return (
      <div>
        {layerTitle}
        {featureAttributes}
      </div>
    )
  }
}
