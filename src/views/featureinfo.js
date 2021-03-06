// @flow
import React from 'react'
import Header from '../components/header'
import slugify from 'slugify'
import Comments from '../components/Comments'
import FeatureProps from '../components/Feature/FeatureProps'
import FeatureNotes from '../components/Feature/FeatureNotes'
import HubEditButton from '../components/Hub/HubEditButton'
import MapStyles from '../components/Map/Styles'
import BaseMapStore from '../stores/map/BaseMapStore'
import MessageActions from '../actions/MessageActions'
import NotificationActions from '../actions/NotificationActions'
import FeatureNotesActions from '../actions/FeatureNotesActions'
import FeatureNotesStore from '../stores/FeatureNotesStore'
import FeaturePhotoStore from '../stores/FeaturePhotoStore'
import {FeatureMap, FeatureArea, FeatureLocation, FeatureExport, FeaturePhoto, ForestReportEmbed} from '../components/Feature'
import MapHubsComponent from '../components/MapHubsComponent'
import Reflux from '../components/Rehydrate'
import LocaleStore from '../stores/LocaleStore'
import type {LocaleStoreState} from '../stores/LocaleStore'
import type {FeaturePhotoStoreState} from '../stores/FeaturePhotoStore'
import type {FeatureNotesStoreState} from '../stores/FeatureNotesStore'
import ErrorBoundary from '../components/ErrorBoundary'

const urlUtil = require('../services/url-util')
const $ = require('jquery')

type Props = {
    feature: Object,
    notes: string,
    photo: Object,
    layer: Object,
    canEdit: boolean,
    locale: string,
    _csrf: string,
    mapConfig: Object,
    headerConfig: Object
  }

  type State = {
    editingNotes: boolean,
    tab: string,
    frActive?: boolean
  } & LocaleStoreState & FeaturePhotoStoreState & FeatureNotesStoreState

export default class FeatureInfo extends MapHubsComponent<Props, State> {
  props: Props

  state: State = {
    editingNotes: false,
    tab: 'data'
  }

  constructor (props: Props) {
    super(props)
    this.stores.push(FeatureNotesStore)
    this.stores.push(FeaturePhotoStore)
    this.stores.push(BaseMapStore)
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf})
    Reflux.rehydrate(FeatureNotesStore, {notes: this.props.notes})
    Reflux.rehydrate(FeaturePhotoStore, {feature: this.props.feature, photo: this.props.photo})
    if (props.mapConfig && props.mapConfig.baseMapOptions) {
      Reflux.rehydrate(BaseMapStore, {baseMapOptions: props.mapConfig.baseMapOptions})
    }
  }

  componentDidMount () {
    $(this.refs.tabs).tabs()
    const _this = this
    window.onbeforeunload = function () {
      if (_this.state.editingNotes) {
        return _this.__('You have not saved your edits, your changes will be lost.')
      }
    }
  }

  startEditingNotes = () => {
    this.setState({editingNotes: true})
  }

  stopEditingNotes = () => {
    const _this = this
    const geoJSONProps: Object = this.props.feature.geojson.features[0].properties

    FeatureNotesActions.saveNotes(this.props.layer.layer_id, geoJSONProps.mhid, this.state._csrf, (err) => {
      if (err) {
        MessageActions.showMessage({title: _this.__('Server Error'), message: err})
      } else {
        NotificationActions.showNotification({message: _this.__('Notes Saved')})
        _this.setState({editingNotes: false})
      }
    })
  }

  // Build edit link
  getEditLink = () => {
    // get map position
    const position = this.refs.map.getMap().getPosition()
    let zoom = Math.ceil(position.zoom)
    if (zoom < 10) zoom = 10
    const baseUrl = urlUtil.getBaseUrl()
    return baseUrl + '/map/new?editlayer=' + this.props.layer.layer_id + '#' + zoom + '/' + position.lat + '/' + position.lng
  }

  openEditor = () => {
    const editLink = this.getEditLink()
    window.location = editLink
  }

  selectTab = (tab: string) => {
    let frActive
    if (this.state.tab === 'forestreport') {
      frActive = true
    }
    this.setState({tab, frActive})
  }

  render () {
    const _this = this
    let featureName: string = 'Feature'

    const {canEdit} = this.props

    if (this.props.feature && this.props.layer && this.props.feature.geojson) {
      // glStyle = this.props.layer.style ? this.props.layer.style : styles[this.props.feature.layer.data_type];

      if (this.props.feature.geojson.features && this.props.feature.geojson.features.length > 0) {
        var geoJSONProps = this.props.feature.geojson.features[0].properties
        if (geoJSONProps.name) {
          featureName = geoJSONProps.name
        }
      }
    }

    const baseUrl = urlUtil.getBaseUrl()

    let notesEditButton
    let editButton
    if (canEdit) {
      notesEditButton = (
        <HubEditButton editing={this.state.editingNotes}
          style={{position: 'absolute'}}
          startEditing={this.startEditingNotes} stopEditing={this.stopEditingNotes} />
      )

      let idEditButton
      if (!this.props.layer.is_external) {
        idEditButton = (
          <li>
            <a onClick={this.openEditor} className='btn-floating layer-info-tooltip blue darken-1' data-delay='50' data-position='left' data-tooltip={this.__('Edit Map Data')}>
              <i className='material-icons'>mode_edit</i>
            </a>
          </li>
        )
      }
      editButton = (
        <div className='fixed-action-btn action-button-bottom-right'>
          <a className='btn-floating btn-large red red-text'>
            <i className='large material-icons'>more_vert</i>
          </a>
          <ul>
            {idEditButton}
          </ul>
        </div>
      )
    }

    const layerUrl = `${baseUrl}/layer/info/${this.props.layer.layer_id}/${slugify(this._o_(this.props.layer.name))}`
    const mhid = this.props.feature.mhid.split(':')[1]

    let gpxLink
    if (this.props.layer.data_type === 'polygon') {
      gpxLink = baseUrl + '/api/feature/gpx/' + this.props.layer.layer_id + '/' + mhid + '/feature.gpx'
    }

    const firstSource = Object.keys(this.props.layer.style.sources)[0]
    const presets = MapStyles.settings.getSourceSetting(this.props.layer.style, firstSource, 'presets')

    let frPanel
    if (MAPHUBS_CONFIG.FR_ENABLE && this.props.canEdit) {
      if (this.state.tab === 'forestreport' || this.state.frActive) {
        frPanel = (
          <div id='forestreport' className='col s12' style={{height: 'calc(100% - 48px)', overflow: 'hidden', padding: 0}}>
            <ForestReportEmbed
              geoJSON={this.props.feature.geojson}
              onLoad={this.map.activateFR}
              onAlertClick={this.map.onAlertClick}
            />
          </div>
        )
      }
    }

    return (
      <ErrorBoundary>
        <Header {...this.props.headerConfig} />
        <main style={{height: 'calc(100% - 52px)', marginTop: '0px'}}>
          <div className='row' style={{height: '100%', margin: 0}}>
            <div className='col s6 no-padding' style={{height: '100%'}}>
              <div className='row no-margin' style={{height: '100%', overflowY: 'hidden'}}>
                <ul ref='tabs' className='tabs' style={{}}>
                  <li className='tab'><a className='active' onClick={function () { _this.selectTab('data') }} href='#data'>{this.__('Info')}</a></li>
                  {(MAPHUBS_CONFIG.FR_ENABLE && this.props.canEdit) &&
                  <li className='tab'><a onClick={function () { _this.selectTab('forestreport') }} href='#forestreport'>{this.__('Forest Report')}</a></li>
                  }
                  <li className='tab'><a onClick={function () { _this.selectTab('photo') }} href='#photo'>{this.__('Photo')}</a></li>
                  {MAPHUBS_CONFIG.enableComments &&
                  <li className='tab'><a onClick={function () { _this.selectTab('discussion') }} href='#discussion'>{this.__('Discussion')}</a></li>
                  }
                  <li className='tab'><a onClick={function () { _this.selectTab('notes') }} href='#notes'>{this.__('Notes')}</a></li>
                </ul>
                <div id='data' className='col s12' style={{height: 'calc(100% - 48px)', overflowY: 'auto', overflowX: 'hidden'}}>
                  <h4>{featureName}</h4>
                  <p style={{fontSize: '16px'}}><b>Layer: </b><a href={layerUrl}>{this._o_(this.props.layer.name)}</a></p>
                  <div className='row no-margin'>
                    <div className='col m6 s12' style={{height: '140px', border: '1px solid #ddd'}}>
                      <FeatureLocation geojson={this.props.feature.geojson} />
                    </div>
                    <div className='col m6 s12' style={{height: '140px', border: '1px solid #ddd'}}>
                      <FeatureArea geojson={this.props.feature.geojson} />
                    </div>
                  </div>

                  <h5>{this.__('Attributes')}</h5>
                  <FeatureProps data={geoJSONProps} presets={presets} />
                  <FeatureExport mhid={mhid} {...this.props.layer} />
                </div>
                {frPanel}
                <div id='photo' className='col s12' style={{height: 'calc(100% - 48px)', textAlign: 'center'}}>
                  {canEdit &&
                  <FeaturePhoto photo={this.state.photo} />
                  }
                </div>
                {MAPHUBS_CONFIG.enableComments &&
                <div id='discussion' className='col s12' style={{height: 'calc(100% - 48px)'}}>
                  <Comments />
                </div>
                }
                <div id='notes' className='col s12' style={{position: 'relative', height: 'calc(100% - 48px)'}}>
                  <FeatureNotes editing={this.state.editingNotes} />
                  {notesEditButton}
                </div>
              </div>
            </div>
            <div className='col s6 no-padding'>
              <FeatureMap ref={(map) => { this.map = map }}
                geojson={this.props.feature.geojson} gpxLink={gpxLink} />
            </div>
          </div>
          {editButton}
        </main>
      </ErrorBoundary>
    )
  }
}
