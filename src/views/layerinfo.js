// @flow
import React from 'react'
import InteractiveMap from '../components/InteractiveMap'
import Header from '../components/header'
import _find from 'lodash.find'
import Comments from '../components/Comments'
import TerraformerGL from '../services/terraformerGL.js'
import GroupTag from '../components/Groups/GroupTag'
import Licenses from '../components/CreateLayer/licenses'
import MessageActions from '../actions/MessageActions'
import NotificationActions from '../actions/NotificationActions'
import LayerNotes from '../components/CreateLayer/LayerNotes'
import HubEditButton from '../components/Hub/HubEditButton'
import LayerNotesActions from '../actions/LayerNotesActions'
import LayerNotesStore from '../stores/LayerNotesStore'
import LayerDataGrid from '../components/DataGrid/LayerDataGrid'
import LayerDataEditorGrid from '../components/DataGrid/LayerDataEditorGrid'
import MapStyles from '../components/Map/Styles'
import BaseMapStore from '../stores/map/BaseMapStore'
import DataEditorActions from '../actions/DataEditorActions'
import geobuf from 'geobuf'
import Pbf from 'pbf'
import turf_area from '@turf/area'
import turf_length from '@turf/length'
import turf_bbox from '@turf/bbox'
import numeral from 'numeral'
import slugify from 'slugify'

import {addLocaleData, IntlProvider, FormattedRelative, FormattedDate, FormattedTime} from 'react-intl'
import en from 'react-intl/locale-data/en'
import es from 'react-intl/locale-data/es'
import fr from 'react-intl/locale-data/fr'
import it from 'react-intl/locale-data/it'
import request from 'superagent'
import MapHubsComponent from '../components/MapHubsComponent'
import Reflux from '../components/Rehydrate'
import fireResizeEvent from '../services/fire-resize-event'
import LocaleStore from '../stores/LocaleStore'
import type {LocaleStoreState} from '../stores/LocaleStore'
import ErrorBoundary from '../components/ErrorBoundary'

const debug = require('../services/debug')('layerinfo')
const urlUtil = require('../services/url-util')

const $ = require('jquery')
const moment = require('moment-timezone')
let clipboard
if (process.env.APP_ENV === 'browser') {
  clipboard = require('clipboard-polyfill')
}

addLocaleData(en)
addLocaleData(es)
addLocaleData(fr)
addLocaleData(it)

type Props = {
  layer: Object,
  notes: string,
  stats: Object,
  canEdit: boolean,
  createdByUser: Object,
  updatedByUser: Object,
  locale: string,
  _csrf: string,
  headerConfig: Object,
  mapConfig: Object
}

type DefaultProps = {
  stats: Object,
  canEdit: boolean,
}

type State = {
  editingNotes: boolean,
  editingData: boolean,
  gridHeight: number,
  gridHeightOffset: number,
  userResize?: boolean,
  geoJSON?: Object,
  dataMsg?: string,
  area?: number,
  length: number,
  count?: number
} & LocaleStoreState

export default class LayerInfo extends MapHubsComponent<Props, State> {
  props: Props

  static defaultProps: DefaultProps = {
    stats: {maps: 0, stories: 0, hubs: 0},
    canEdit: false
  }

  state: State = {
    editingNotes: false,
    editingData: false,
    gridHeight: 100,
    gridHeightOffset: 48,
    length: 0
  }

  constructor (props: Props) {
    super(props)
    this.stores.push(LayerNotesStore)
    this.stores.push(BaseMapStore)
    Reflux.rehydrate(LocaleStore, {locale: this.props.locale, _csrf: this.props._csrf})
    Reflux.rehydrate(LayerNotesStore, {notes: this.props.notes})
    if (props.mapConfig && props.mapConfig.baseMapOptions) {
      Reflux.rehydrate(BaseMapStore, {baseMapOptions: props.mapConfig.baseMapOptions})
    }
  }

  componentDidMount () {
    const _this = this
    $(this.refs.tabs).tabs()
    $('.layer-info-tooltip').tooltip()

    if (this.props.layer.is_external) {
      // retreive geoJSON data for layers
      if (this.props.layer.external_layer_config.type === 'ags-mapserver-query') {
        TerraformerGL.getArcGISGeoJSON(this.props.layer.external_layer_config.url)
          .then((geoJSON) => {
            return _this.setState({geoJSON})
          }).catch(err => {
            debug.error(err)
          })
        _this.setState({dataMsg: _this.__('Data Loading')})
      } else if (this.props.layer.external_layer_config.type === 'ags-featureserver-query') {
        TerraformerGL.getArcGISFeatureServiceGeoJSON(this.props.layer.external_layer_config.url)
          .then((geoJSON) => {
            return _this.setState({geoJSON})
          }).catch(err => {
            debug.error(err)
          })
        _this.setState({dataMsg: _this.__('Data Loading')})
      } else if (this.props.layer.external_layer_config.type === 'geojson') {
        request.get(this.props.layer.external_layer_config.data)
          .type('json').accept('json')
          .end((err, res) => {
            if (err) {
              MessageActions.showMessage({title: _this.__('Server Error'), message: err})
            } else {
              const geoJSON = res.body
              _this.setState({geoJSON})
            }
          })
        _this.setState({dataMsg: _this.__('Data Loading')})
      } else {
        _this.setState({dataMsg: _this.__('Data table not support for this layer.')})
      }
    } else {
      this.getGeoJSON()
      _this.setState({dataMsg: _this.__('Data Loading')})
    }

    window.onbeforeunload = function () {
      if (_this.state.editingNotes || _this.state.editingData) {
        return _this.__('You have not saved your edits, your changes will be lost.')
      }
    }
  }

  componentDidUpdate (prevProps: Props, prevState: State) {
    if (!this.state.userResize) {
      fireResizeEvent()
    }
    if (this.state.editingData && !prevState.editingData) {
      fireResizeEvent()
    }
  }

  getGeoJSON = () => {
    const _this = this
    let baseUrl, dataUrl
    if (this.props.layer.remote) {
      baseUrl = 'https://' + this.props.layer.remote_host
      dataUrl = baseUrl + '/api/layer/' + this.props.layer.remote_layer_id + '/export/geobuf/data.pbf'
    } else {
      baseUrl = urlUtil.getBaseUrl()
      dataUrl = baseUrl + '/api/layer/' + this.props.layer.layer_id + '/export/geobuf/data.pbf'
    }

    request.get(dataUrl)
      .buffer(true)
      .responseType('arraybuffer')
      .parse(request.parse.image)
      .end((err, res) => {
        if (err) {
          debug.error(err)
        } else {
          const geoJSON = geobuf.decode(new Pbf(new Uint8Array(res.body)))
          const count = geoJSON.features.length
          let area
          let length = 0
          if (this.props.layer.data_type === 'polygon') {
            const areaM2 = turf_area(geoJSON)
            if (areaM2 && areaM2 > 0) {
              area = areaM2 / 10000.00
            }
          } else if (this.props.layer.data_type === 'line') {
            geoJSON.features.forEach(feature => {
              if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                length += turf_length(feature.geometry, {units: 'kilometers'})
              }
            })
          }

          _this.setState({geoJSON, count, area, length})
        }
      })
  }

  onTabSelect = () => {
    const _this = this

    const gridHeight = $(this.refs.dataTabContent).height() - _this.state.gridHeightOffset
    this.setState({gridHeight})

    $(window).resize(() => {
      const gridHeight = $(_this.refs.dataTabContent).height() - _this.state.gridHeightOffset
      _this.setState({gridHeight, userResize: true})
    })
  }

  onRowSelected = (idVal: string, idField: string) => {
    const _this = this
    if (this.state.geoJSON) {
      this.state.geoJSON.features.forEach((feature) => {
        if (idVal === feature.properties[idField]) {
          const bbox = turf_bbox(feature)
          _this.refs.interactiveMap.getMap().fitBounds(bbox, 16, 25)
        }
      })
    }
  }

  // Build edit link
  getEditLink = () => {
    // get map position
    const position = this.refs.interactiveMap.getMap().getPosition()
    let zoom = Math.ceil(position.zoom)
    if (zoom < 10) zoom = 10
    const baseUrl = urlUtil.getBaseUrl()
    return baseUrl + '/map/new?editlayer=' + this.props.layer.layer_id + '#' + zoom + '/' + position.lat + '/' + position.lng
  }

  openEditor = () => {
    const editLink = this.getEditLink()
    window.location = editLink
  }

  handleNewComment = () => {

  }

  startEditingNotes = () => {
    this.setState({editingNotes: true})
  }

  stopEditingNotes = () => {
    const _this = this

    LayerNotesActions.saveNotes(this.props.layer.layer_id, this.state._csrf, (err) => {
      if (err) {
        MessageActions.showMessage({title: _this.__('Server Error'), message: err})
      } else {
        NotificationActions.showNotification({message: _this.__('Notes Saved')})
        _this.setState({editingNotes: false})
      }
    })
  }

  startEditingData = () => {
    this.setState({editingData: true})
  }

  stopEditingData = () => {
    const _this = this
    DataEditorActions.saveEdits(this.state._csrf, (err) => {
      if (err) {
        MessageActions.showMessage({title: _this.__('Server Error'), message: err})
      } else {
        NotificationActions.showNotification({
          message: _this.__('Data Saved - Reloading Page...'),
          dismissAfter: 1000,
          onDismiss () {
            location.reload()
          }
        })
        _this.setState({editingData: false})
        DataEditorActions.stopEditing()
      }
    })
  }

  copyToClipboard = (val: string) => {
    clipboard.writeText(val)
  }

  render () {
    const _this = this
    const glStyle = this.props.layer.style

    let exportTabContent = ''

    if (this.props.layer.is_external) {
      exportTabContent = (
        <div>
          <p>{this.__('This is an external data layer. For exports please see the data source at:')} {this._o_(this.props.layer.source)}</p>
        </div>
      )
    } else {
      const name = slugify(this._o_(this.props.layer.name))
      const layerId = this.props.layer.layer_id

      const maphubsFileURL = `/api/layer/${layerId}/export/maphubs/${name}.maphubs`
      const geoJSONURL = `/api/layer/${layerId}/export/json/${name}.geojson`
      const shpURL = `/api/layer/${layerId}/export/shp/${name}.zip`
      const kmlURL = `/api/layer/${layerId}/export/kml/${name}.kml`
      const csvURL = `/api/layer/${layerId}/export/csv/${name}.csv`
      const gpxURL = `/api/layer/${layerId}/export/gpx/${name}.gpx`
      const svgURL = `/api/layer/${layerId}/export/svg/${name}.svg`
      const geobufURL = `/api/layer/${layerId}/export/geobuf/${name}.pbf`

      if (!this.props.layer.disable_export) {
        let gpxExport = ''
        if (this.props.layer.data_type !== 'polygon') {
          gpxExport = (
            <li className='collection-item'>{this.__('GPX:')} <a href={gpxURL}>{gpxURL}</a></li>
          )
        }
        exportTabContent = (
          <div>
            <ul className='collection with-header'>
              <li className='collection-header'><h5>{this.__('Export Data')}</h5></li>
              <li className='collection-item'>{this.__('MapHubs Format:')} <a href={maphubsFileURL}>{maphubsFileURL}</a></li>
              <li className='collection-item'>{this.__('Shapefile:')} <a href={shpURL}>{shpURL}</a></li>
              <li className='collection-item'>{this.__('GeoJSON:')} <a href={geoJSONURL}>{geoJSONURL}</a></li>
              <li className='collection-item'>{this.__('KML:')} <a href={kmlURL}>{kmlURL}</a></li>
              <li className='collection-item'>{this.__('CSV:')} <a href={csvURL}>{csvURL}</a></li>
              <li className='collection-item'>{this.__('SVG:')} <a href={svgURL}>{svgURL}</a></li>
              <li className='collection-item'>{this.__('Geobuf:')} <a href={geobufURL}>{geobufURL}</a> (<a href='https://github.com/mapbox/geobuf'>{this.__('Learn More')}</a>)</li>
              {gpxExport}
            </ul>
          </div>
        )
      } else {
        exportTabContent = (
          <div>
            <p>{this.__('Export is not available for this layer.')}</p>
          </div>
        )
      }
    }

    let tabContentDisplay = 'none'
    if (typeof window !== 'undefined') {
      tabContentDisplay = 'inherit'
    }

    let editButton = ''
    let notesEditButton
    let dataEditButton

    if (this.props.canEdit) {
      notesEditButton = (
        <HubEditButton editing={this.state.editingNotes}
          style={{position: 'absolute'}}
          startEditing={this.startEditingNotes} stopEditing={this.stopEditingNotes} />
      )

      dataEditButton = (
        <HubEditButton editing={this.state.editingData}
          style={{position: 'absolute', bottom: '10px'}}
          startEditing={this.startEditingData} stopEditing={this.stopEditingData} />
      )

      let mapEditButton = ''
      let addPhotoPointButton = ''
      if (!this.props.layer.is_external && !this.props.layer.remote) {
        mapEditButton = (
          <li>
            <a onClick={this.openEditor} className='btn-floating layer-info-tooltip blue darken-1' data-delay='50' data-position='left' data-tooltip={this.__('Edit Map Data')}>
              <i className='material-icons'>mode_edit</i>
            </a>
          </li>
        )
        if (this.props.layer.data_type === 'point') {
          addPhotoPointButton = (
            <li>
              <a href={'/layer/adddata/' + this.props.layer.layer_id} className='btn-floating layer-info-tooltip blue darken-1' data-delay='50' data-position='left' data-tooltip={this.__('Add a Photo')}>
                <i className='material-icons'>photo</i>
              </a>
            </li>
          )
        }
      }
      editButton = (
        <div className='fixed-action-btn action-button-bottom-right'>
          <a className='btn-floating btn-large red red-text'>
            <i className='large material-icons'>more_vert</i>
          </a>
          <ul>
            {mapEditButton}
            {addPhotoPointButton}
            <li>
              <a className='btn-floating layer-info-tooltip yellow' href={'/layer/admin/' + this.props.layer.layer_id + '/' + slugify(this._o_(this.props.layer.name))}data-delay='50' data-position='left' data-tooltip={this.__('Manage Layer')}>
                <i className='material-icons'>settings</i>
              </a>
            </li>
          </ul>
        </div>
      )
    } else {
      editButton = (
        <div className='fixed-action-btn action-button-bottom-right hide-on-med-and-up'>
          <a className='btn-floating btn-large layer-info-tooltip red' data-delay='50' data-position='left' data-tooltip={this.__('View Map')}
            href={'/layer/map/' + this.props.layer.layer_id + '/' + slugify(this._o_(this.props.layer.name))}>
            <i className='material-icons'>map</i>
          </a>
        </div>
      )
    }

    const guessedTz = moment.tz.guess()
    const creationTimeObj = moment.tz(this.props.layer.creation_time, guessedTz)
    const creationTime = creationTimeObj.format()
    const updatedTimeObj = moment.tz(this.props.layer.last_updated, guessedTz)
    const updatedTimeStr = updatedTimeObj.format()
    let updatedTime = ''
    if (updatedTimeObj > creationTimeObj) {
      updatedTime = (
        <p style={{fontSize: '16px'}}><b>{this.__('Last Update:')} </b>
          <IntlProvider locale={this.state.locale}>
            <FormattedDate value={updatedTimeStr} />
          </IntlProvider>&nbsp;
          <IntlProvider locale={this.state.locale}>
            <FormattedTime value={updatedTimeStr} />
          </IntlProvider>&nbsp;
          (<IntlProvider locale={this.state.locale}>
            <FormattedRelative value={updatedTimeStr} />
          </IntlProvider>)&nbsp;
          {this.__('by') + ' ' + this.props.updatedByUser.display_name}
        </p>
      )
    }

    const licenseOptions = Licenses.getLicenses(this.__)
    const license = _find(licenseOptions, {value: this.props.layer.license})

    let descriptionWithLinks = ''

    if (this.props.layer.description) {
      // regex for detecting links
      const localizedDescription = this._o_(this.props.layer.description)
      const regex = /(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/ig
      descriptionWithLinks = localizedDescription.replace(regex, "<a href='$1' target='_blank' rel='noopener noreferrer'>$1</a>")
    }

    let remote = ''
    if (this.props.layer.remote) {
      const remoteURL = 'https://' + this.props.layer.remote_host + '/layer/info/' + this.props.layer.remote_layer_id + '/' + slugify(this._o_(this.props.layer.name))
      remote = (
        <p style={{fontSize: '16px'}}><b>{this.__('Remote Layer from: ')} </b>
          <a href={remoteURL} target='_blank' rel='noopener noreferrer'>{remoteURL}</a>
        </p>
      )
    }

    let external = ''
    if (this.props.layer.is_external && !this.props.layer.remote) {
      let externalUrl = this.props.layer.external_layer_config.url
      let type = ''
      if (this.props.layer.external_layer_type === 'openstreetmap') {
        type = 'OpenStreetMap'
        externalUrl = 'http://openstreetmap.org'
      } else if (this.props.layer.external_layer_config.type === 'raster') {
        type = 'Raster'
        externalUrl = this.props.layer.external_layer_config.tiles[0]
      } else if ((!this.props.layer.external_layer_type || this.props.layer.external_layer_type === '') &&
              this.props.layer.external_layer_config.type) {
        type = this.props.layer.external_layer_config.type
      } else if (this.props.layer.external_layer_config.type === 'geojson') {
        type = 'GeoJSON'
        externalUrl = this.props.layer.external_layer_config.data
      } else {
        type = this.props.layer.external_layer_type
      }
      external = (
        <div>
          <p style={{fontSize: '16px'}}><b>{this.__('External Layer: ')}</b>{type}
            &nbsp;-&nbsp;
            <a href={externalUrl} target='_blank' rel='noopener noreferrer'>{externalUrl}</a>
            <i className='material-icons layer-info-tooltip omh-accent-text' style={{cursor: 'pointer'}} data-delay='50' onClick={function () { _this.copyToClipboard(externalUrl) }} data-position='left' data-tooltip={this.__('Copy to Clipboard')}>launch</i>
          </p>
        </div>
      )
    }

    let commentTab, commentPanel
    if (MAPHUBS_CONFIG.enableComments) {
      commentTab = (
        <li className='tab'><a href='#discuss'>{this.__('Discuss')}</a></li>
      )
      commentPanel = (
        <Comments />
      )
    }

    let privateIcon = ''
    if (this.props.layer.private) {
      privateIcon = (
        <div style={{position: 'absolute', top: '15px', right: '10px'}}>
          <i className='material-icons grey-text text-darken-3 layer-info-tooltip'
            data-position='left' data-delay='50' data-tooltip={this.__('Private')}>
        lock</i>
        </div>
      )
    }

    const firstSource = Object.keys(this.props.layer.style.sources)[0]
    const presets = MapStyles.settings.getSourceSetting(this.props.layer.style, firstSource, 'presets')

    let dataGrid = ''
    if (this.state.editingData) {
      dataGrid = (
        <LayerDataEditorGrid
          layer={this.props.layer}
          gridHeight={this.state.gridHeight}
          geoJSON={this.state.geoJSON}
          presets={presets}
          onRowSelected={this.onRowSelected}
          canEdit
        />
      )
    } else {
      dataGrid = (
        <LayerDataGrid
          layer_id={this.props.layer.layer_id}
          gridHeight={this.state.gridHeight}
          geoJSON={this.state.geoJSON}
          presets={presets}
          onRowSelected={this.onRowSelected}
          canEdit={this.props.canEdit} />
      )
    }

    return (

      <ErrorBoundary>
        <Header {...this.props.headerConfig} />
        <main style={{height: 'calc(100% - 51px)', marginTop: 0}}>
          <div className='row' style={{height: '100%', margin: 0}}>
            <div className='col s12 m6 l6 no-padding' style={{height: '100%', position: 'relative'}}>
              {privateIcon}
              <div style={{margin: '10px', height: '50px'}}>
                <h5 className='word-wrap'>{this._o_(this.props.layer.name)}</h5>
              </div>

              <div className='row no-margin' style={{height: 'calc(100% - 72px)'}}>
                <ul ref='tabs' className='tabs' style={{overflowX: 'auto'}}>
                  <li className='tab'><a className='active' href='#info'>{this.__('Info')}</a></li>
                  <li className='tab'><a href='#notes'>{this.__('Notes')}</a></li>
                  {commentTab}
                  <li className='tab'><a href='#data' onClick={this.onTabSelect}>{this.__('Data')}</a></li>
                  <li className='tab'><a href='#export'>{this.__('Export')}</a></li>
                </ul>
                <div id='info' className='col s12 no-padding' style={{height: 'calc(100% - 47px)', position: 'relative'}}>
                  <div className='row word-wrap' style={{height: 'calc(100% - 75px)', marginLeft: '10px', marginRight: '10px', overflowY: 'auto', overflowX: 'hidden'}}>
                    <div className='right'>
                      <GroupTag group={this.props.layer.owned_by_group_id} size={25} fontSize={12} />
                    </div>
                    {remote}
                    {external}
                    <p style={{fontSize: '16px'}}><b>{this.__('Feature Count:')} </b>{numeral(this.state.count).format('0,0')}</p>
                    {this.state.area &&
                      <p style={{fontSize: '16px'}}><b>{this.__('Area:')} </b>{numeral(this.state.area).format('0,0.00')} ha</p>
                    }
                    {this.state.length > 0 &&
                      <p style={{fontSize: '16px'}}><b>{this.__('Length:')} </b>{numeral(this.state.length).format('0,0.00')} km</p>
                    }
                    <p style={{fontSize: '16px'}}><b>{this.__('Created:')} </b>
                      <IntlProvider locale={this.state.locale}>
                        <FormattedDate value={creationTime} />
                      </IntlProvider>&nbsp;
                      <IntlProvider locale={this.state.locale}>
                        <FormattedTime value={creationTime} />
                      </IntlProvider>&nbsp;
                  (
                      <IntlProvider locale={this.state.locale}>
                        <FormattedRelative value={creationTime} />
                      </IntlProvider>
                  )&nbsp;
                      {this.__('by') + ' ' + this.props.updatedByUser.display_name}
                    </p>
                    {updatedTime}
                    <p style={{fontSize: '16px', maxHeight: '55px', overflow: 'auto'}}><b>{this.__('Data Source:')}</b> {this._o_(this.props.layer.source)}</p>
                    <p style={{fontSize: '16px'}}><b>{this.__('License:')}</b> {license.label}</p><div dangerouslySetInnerHTML={{__html: license.note}} />
                    <p className='word-wrap' style={{fontSize: '16px', maxHeight: '95px', overflow: 'auto'}}><b>{this.__('Description:')}</b></p><div dangerouslySetInnerHTML={{__html: descriptionWithLinks}} />

                  </div>

                  <div className='row no-margin' style={{position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFF'}}>
                    <div className='col s6 m3 l3 center-align'>
                      <b className='center-align'>{this.__('Views')}</b>
                      <p className='center-align'>{this.props.layer.views}</p>
                    </div>
                    <div className='col s6 m3 l3 center-align'>
                      <b className='center-align'>{this.__('Maps')}</b>
                      <p className='center-align'>{this.props.stats.maps}</p>
                    </div>
                    <div className='col s6 m3 l3 center-align'>
                      <b className='center-align'>{this.__('Stories')}</b>
                      <p className='center-align'>{this.props.stats.stories}</p>
                    </div>
                    <div className='col s6 m3 l3 center-align'>
                      <b className='center-align'>{this.__('Hubs')}</b>
                      <p className='center-align'>{this.props.stats.hubs}</p>
                    </div>
                  </div>
                </div>
                <div id='notes' className='col s12' style={{height: 'calc(100% - 47px)', display: tabContentDisplay, position: 'relative'}}>
                  <LayerNotes editing={this.state.editingNotes} />
                  {notesEditButton}
                </div>
                <div id='discuss' className='col s12' style={{display: tabContentDisplay}}>
                  {commentPanel}
                </div>
                <div id='data' ref='dataTabContent' className='col s12 no-padding' style={{height: 'calc(100% - 47px)', display: tabContentDisplay}}>
                  <div className='row no-margin'>
                    {dataGrid}

                  </div>
                  {dataEditButton}
                </div>
                <div id='export' className='col s12' style={{display: tabContentDisplay}}>
                  {exportTabContent}
                </div>
              </div>

            </div>
            <div className='col hide-on-small-only m6 l6 no-padding' style={{height: '100%'}}>
              <InteractiveMap ref='interactiveMap' height='100vh - 50px'
                fitBounds={this.props.layer.preview_position.bbox}
                style={glStyle}
                layers={[this.props.layer]}
                map_id={this.props.layer.layer_id}
                mapConfig={this.props.mapConfig}
                title={this.props.layer.name}
                showTitle={false}
                hideInactive={false}
                disableScrollZoom={false}
              />

            </div>
          </div>
          {editButton}
        </main>
      </ErrorBoundary>
    )
  }
}
