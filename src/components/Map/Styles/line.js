// @flow

import type {GLLayer} from '../../../types/mapbox-gl-style'

module.exports = {
  getLineLayers (layer_id: number, shortid: string,
    color: string, hoverColor: string,
    interactive: boolean, showBehindBaseMapLabels: boolean): Array<GLLayer> {
    const layers = [
      {
        'id': `omh-data-line-${layer_id}-${shortid}`,
        'type': 'line',
        'metadata': {
          'maphubs:layer_id': layer_id,
          'maphubs:globalid': shortid,
          'maphubs:interactive': interactive,
          'maphubs:showBehindBaseMapLabels': showBehindBaseMapLabels
        },
        'source': 'omh-' + shortid,
        'source-layer': '',
        'filter': ['in', '$type', 'LineString'],
        'paint': {
          'line-color': color,
          'line-opacity': 0.5,
          'line-width': 2
        }
      },
      {
        'id': `omh-hover-line-${layer_id}-${shortid}`,
        'type': 'line',
        'metadata': {
          'maphubs:layer_id': layer_id,
          'maphubs:globalid': shortid
        },
        'source': 'omh-' + shortid,
        'source-layer': '',
        'filter': ['==', 'mhid', ''],
        'paint': {
          'line-color': hoverColor,
          'line-opacity': 0.3,
          'line-width': 1
        }
      }
    ]

    if (layer_id !== 'geojson') {
      layers.forEach((layer) => {
        layer['source-layer'] = 'data'
      })
    }
    return layers
  }
}
