// @flow
import React from 'react'
import _centroid from '@turf/centroid'
import MapToolButton from './MapToolButton'
import BaseMapActions from '../../actions/map/BaseMapActions'
const debug = require('../../services/debug')('map')
const $ = require('jquery')

let mapboxgl = {}

if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl')
}

type Props = {
  id: string,
  bottom: string,
  collapsible: boolean,
  collapsed: boolean,
  maxZoom: number,
  padding: number,
  minHeight: string,
  maxHeight: string,
  minWidth: string,
  maxWidth: string,
  height: string,
  width: string,
  fixedPosition?: {
    center: Array<number>,
    zoom: number
  },
  baseMap?: string
}

type State = {|
  collapsed: boolean,
  insetGeoJSONData: Object,
  insetGeoJSONCentroidData: Object
|}

export default class InsetMap extends React.Component<Props, State> {
  insetMap: Object
  insetMapActive: boolean

  props: Props

  static defaultProps = {
    id: 'map',
    bottom: '30px',
    collapsible: true,
    collapsed: false,
    maxZoom: 1.5,
    padding: 10,
    minHeight: '100px',
    maxHeight: '145px',
    minWidth: '100px',
    maxWidth: '145px',
    height: '25vw',
    width: '25vw'
  }

  insetMapComponent: React$Component<void, void>
  insetMapArrow: React$Component<void, void>

  state: State

  constructor (props: Props) {
    super(props)
    this.state = {
      collapsed: props.collapsed,
      insetGeoJSONData: {},
      insetGeoJSONCentroidData: {}
    }
  }

  componentDidMount () {
    if (this.insetMapComponent) {
      $(this.insetMapComponent).show()
    }
  }

  componentDidUpdate (prevProps: Props, prevState: State) {
    if (this.insetMap) {
      if (!this.state.collapsed) {
        $(this.insetMapArrow).show()
      }

      if (!this.insetMapActive ||
        (prevState.collapsed && !this.state.collapsed)) {
        $(this.insetMapComponent).addClass('z-depth-1')
        $(this.insetMapComponent).css('border', '0.5px solid rgba(222,222,222,50)')
      }

      if (!this.insetMapActive) {
        this.insetMapActive = true
      }
    }
  }

  createInsetMap = (center: any, bounds: Object, baseMap: string) => {
    const _this = this

    if (this.props.fixedPosition) {
      // ignore position info and use fixed
      if (this.props.fixedPosition.center) {
        center = this.props.fixedPosition.center
      }
    }

    if (this.props.baseMap) {
      BaseMapActions.getBaseMapFromName(this.props.baseMap, (baseMapUrl) => {
        baseMap = baseMapUrl
      })
    }

    const insetMap = new mapboxgl.Map({
      container: this.props.id + '_inset',
      style: baseMap,
      zoom: 0,
      maxZoom: this.props.maxZoom,
      interactive: false,
      center,
      attributionControl: false
    })

    insetMap.on('styledata', () => {
      // create geojson from bounds

      const insetGeoJSONData = this.insetMap.getSource('inset-bounds')
      if (!insetGeoJSONData) {
        // create layers
        const geoJSON = _this.getGeoJSONFromBounds(bounds)
        geoJSON.features[0].properties = {'v': 1}
        const geoJSONCentroid = _centroid(geoJSON)
        geoJSONCentroid.properties = {'v': 1}

        insetMap.addSource('inset-bounds', {'type': 'geojson', data: geoJSON})
        insetMap.addSource('inset-centroid', {'type': 'geojson', data: geoJSONCentroid})
        insetMap.addLayer({
          'id': 'bounds',
          'type': 'line',
          'source': 'inset-bounds',
          'paint': {
            'line-color': 'rgb(244, 118, 144)',
            'line-opacity': 0.75,
            'line-width': 5
          }
        })

        insetMap.addLayer({
          'id': 'center',
          'type': 'circle',
          'source': 'inset-centroid',
          'paint': {
            'circle-color': 'rgb(244, 118, 144)',
            'circle-opacity': 0.75
          }
        })

        if (_this.showInsetAsPoint()) {
          insetMap.setFilter('center', ['==', 'v', 1])
          insetMap.setFilter('bounds', ['==', 'v', 2])
        } else {
          insetMap.setFilter('center', ['==', 'v', 2])
          insetMap.setFilter('bounds', ['==', 'v', 1])
        }
      }
    })
    _this.insetMap = insetMap
    return insetMap
  }

  reloadInset = (baseMapUrl: string) => {
    if (this.insetMap) {
      if (this.props.baseMap) {
        BaseMapActions.getBaseMapFromName(this.props.baseMap, (baseMap) => {
          baseMapUrl = baseMap
        })
      }
      this.insetMap.setStyle(baseMapUrl)
    }
  }

  sync = (map: Object) => {
    if (this.insetMap && this.props.fixedPosition) {
      this.updateInsetFixedPosition(map)
    } else {
      this.updateInsetGeomFromBounds(map)
    }
  }

  toggleCollapsed = () => {
    if (this.state.collapsed) {
      this.setState({collapsed: false})
    } else {
      this.setState({collapsed: true})
      $(this.insetMapComponent).show()
    }
  }

  getInsetMap = () => {
    return this.insetMap
  }

    getGeoJSONFromBounds = (bounds: Object) => {
      const v1 = bounds.getNorthWest().toArray()
      const v2 = bounds.getNorthEast().toArray()
      const v3 = bounds.getSouthEast().toArray()
      const v4 = bounds.getSouthWest().toArray()
      const v5 = v1
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            name: 'bounds'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [ v1, v2, v3, v4, v5 ]
            ]
          }
        }]
      }
    }

  showInsetAsPoint = (zoom: any) => {
    if (zoom && zoom > 9) {
      return true
    }
    return false
  }

   updateInsetGeomFromBounds = (map: Object) => {
     const bounds = map.getBounds()
     const zoom = map.getZoom()
     const center = map.getCenter()
     if (this.insetMap) {
       const insetGeoJSONData = this.insetMap.getSource('inset-bounds')
       const insetGeoJSONCentroidData = this.insetMap.getSource('inset-centroid')
       if (insetGeoJSONData || insetGeoJSONCentroidData) {
         try {
           const geoJSONBounds = this.getGeoJSONFromBounds(bounds)
           geoJSONBounds.features[0].properties = {'v': 1}
           insetGeoJSONData.setData(geoJSONBounds)
           const geoJSONCentroid = _centroid(geoJSONBounds)
           geoJSONCentroid.properties = {'v': 1}
           insetGeoJSONCentroidData.setData(geoJSONCentroid)
           this.setState({insetGeoJSONData, insetGeoJSONCentroidData})

           const config = {
             maxZoom: this.props.maxZoom,
             padding: this.props.padding,
             animate: false
           }

           if (zoom < 2.3) {
             this.insetMap.setFilter('center', ['==', 'v', 2])
             this.insetMap.setFilter('bounds', ['==', 'v', 2])
             this.insetMap.jumpTo({center}, config)
           } else if (this.showInsetAsPoint(zoom)) {
             this.insetMap.setFilter('center', ['==', 'v', 1])
             this.insetMap.setFilter('bounds', ['==', 'v', 2])
             this.insetMap.fitBounds([[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]], config)
           } else {
             this.insetMap.setFilter('center', ['==', 'v', 2])
             this.insetMap.setFilter('bounds', ['==', 'v', 1])
             this.insetMap.fitBounds([[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]], config)
           }
         } catch (err) {
           debug.error(err)
         }
       }
     }
   }

  updateInsetFixedPosition = (map: Object) => {
    const bounds = map.getBounds()
    if (this.insetMap) {
      const insetGeoJSONData = this.insetMap.getSource('inset-bounds')
      const insetGeoJSONCentroidData = this.insetMap.getSource('inset-centroid')
      if (insetGeoJSONData || insetGeoJSONCentroidData) {
        try {
          const geoJSONBounds = this.getGeoJSONFromBounds(bounds)
          geoJSONBounds.features[0].properties = {'v': 1}
          insetGeoJSONData.setData(geoJSONBounds)
          const geoJSONCentroid = _centroid(geoJSONBounds)
          geoJSONCentroid.properties = {'v': 1}
          insetGeoJSONCentroidData.setData(geoJSONCentroid)
          this.setState({insetGeoJSONData, insetGeoJSONCentroidData})

          const config = {
            maxZoom: this.props.maxZoom,
            padding: this.props.padding,
            animate: false
          }
          if (this.props.fixedPosition) {
            const fixedPosition = this.props.fixedPosition
            this.insetMap.jumpTo({center: fixedPosition.center}, config)
            this.insetMap.zoomTo(fixedPosition.zoom)
          }
        } catch (err) {
          debug.error(err)
        }
      }
    }
  }

  render () {
    if (this.state.collapsed) {
      return (
        <div style={{
          position: 'absolute', bottom: this.props.bottom, left: '5px'
        }}>

          <div id={this.props.id + '_inset'}
            ref={(c) => { this.insetMapComponent = c }}
            style={{
              display: 'none'
            }}>
            <MapToolButton onClick={this.toggleCollapsed}
              color='#212121'
              top='auto' right='auto' bottom='5px' left='5px' icon='near_me' />
          </div>
        </div>
      )
    } else {
      let collapseIcon = ''
      if (this.props.collapsible) {
        collapseIcon = (
          <i className='material-icons'
            ref={(c) => { this.insetMapArrow = c }}
            onClick={this.toggleCollapsed}
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              height: '30px',
              display: 'none',
              lineHeight: '30px',
              width: '30px',
              color: '#717171',
              cursor: 'pointer',
              textAlign: 'center',
              zIndex: 1,
              transform: 'rotate(45deg)',
              fontSize: '18px'}}
          >arrow_downward</i>
        )
      }

      return (
        <div style={{
          position: 'absolute',
          bottom: this.props.bottom,
          left: '5px',
          minHeight: this.props.minHeight,
          maxHeight: this.props.maxHeight,
          minWidth: this.props.minWidth,
          maxWidth: this.props.maxWidth,
          height: this.props.height,
          width: this.props.width
        }}>
          <div id={this.props.id + '_inset'}
            ref={(c) => { this.insetMapComponent = c }}
            className='map'
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'none',
              zIndex: 1
            }} />
          {collapseIcon}
        </div>
      )
    }
  }
}
