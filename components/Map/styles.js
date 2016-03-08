var config = require('../../clientconfig');

module.exports = {

  styleWithColor(layer_id, source, color, selectedColors) {

      //TODO: make default selected colors better match user color
      var inactiveColor = "grey";
      var inactiveOutlineColor = "red";
      var hoverColor = "yellow";
      var hoverOutlineColor = "black";
      if (selectedColors) {
        inactiveColor = selectedColors.inactive;
        inactiveOutlineColor = selectedColors.inactiveOutline;
        hoverColor = selectedColors.hover;
        hoverOutlineColor = selectedColors.hoverOutline;
      }

      var styles = {

          sources: {},
          layers: [
            {
              "id": "omh-data-point-" + layer_id,
              "type": "circle",
              "interactive": true,
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["in", "$type", "Point"],
              "paint": {
                "circle-color": color,
                "circle-opacity": 0.5
              },
              "paint.selected": {
                "circle-color": inactiveColor,
                "circle-opacity": 0.3
              }
            },
            {
              "id": "omh-data-line-" + layer_id,
              "type": "line",
              "interactive": true,
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["in", "$type", "LineString"],
              "paint": {
                "line-color": color,
                "line-opacity": 0.5,
                "line-width": 2
              },
              "paint.selected": {
                "line-color": inactiveColor,
                "line-opacity": 0.3,
                "line-width": 1
              }
            },
            {
              "id": "omh-data-polygon-" + layer_id,
              "type": "fill",
              "interactive": true,
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["in", "$type", "Polygon"],
              "paint": {
                "fill-color": color,
                "fill-outline-color": color,
                "fill-opacity": 0.5
              },
              "paint.selected": {
                "fill-color": inactiveColor,
                "fill-outline-color": inactiveOutlineColor,
                "fill-opacity": 0.3
              }
            }, {
              "id": "omh-data-doublestroke-polygon-" + layer_id,
              "type": "line",
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["in", "$type", "Polygon"],
              "paint": {
                "line-color": color,
                "line-opacity": 0.3,
                "line-width": {
                  "base": 0.5,
                  "stops": [
                    [5, 1.0],
                    [6, 2.0],
                    [7, 3.0],
                    [8, 4.0],
                    [9, 5.0],
                    [10, 6.0]
                  ]
                },
                "line-offset": {
                  "base": 0.5,
                  "stops": [
                    [5, -0.5],
                    [6, -1.0],
                    [7, -1.5],
                    [8, -2.0],
                    [9, -2.5],
                    [10, -3.0]
                  ]
                }
              }
            }, {
              "id": "omh-data-outline-polygon-" + layer_id,
              "type": "line",
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["in", "$type", "Polygon"],
              "paint": {
                "line-color": "#222222",
                "line-opacity": 0.8,
                "line-width": {
                  "base": 0.5,
                  "stops": [
                    [3, 0.1],
                    [4, 0.2],
                    [5, 0.3],
                    [6, 0.4],
                    [7, 0.5],
                    [8, 0.6],
                    [9, 0.7],
                    [10, 0.8]
                  ]
                }
              }
            },
            {
              "id": "omh-hover-point-" + layer_id,
              "type": "circle",
              "interactive": false,
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["==", "osm_id", ""],
              "paint": {
                "circle-radius": 15,
                "circle-color": hoverColor,
                "circle-opacity": 0.5
              },
              "paint.selected": {
                "circle-radius": 15,
                "circle-color": hoverColor,
                "circle-opacity": 0.5
              }
            },
            {
              "id": "omh-hover-line-" + layer_id,
              "type": "line",
              "interactive": false,
              "source": "omh-" + layer_id,
              "source-layer": "data",
              "filter": ["==", "osm_id", ""],
              "paint": {
                "line-color": hoverColor,
                "line-opacity": 0.3,
                "line-width": 1
              },
              "paint.selected": {
                "line-color": hoverColor,
                "line-opacity": 0.3,
                "line-width": 1
              }
            },
            {
            "id": "omh-hover-polygon-" + layer_id,
            "type": "fill",
            "interactive": false,
            "source": "omh-" + layer_id,
            "source-layer": "data",
            "filter": ["==", "osm_id", ""],
            "paint": {
              "fill-color": hoverColor,
              "fill-outline-color": hoverOutlineColor,
              "fill-opacity": 0.7
            },
            "paint.selected": {
              "fill-color": hoverColor,
              "fill-outline-color": hoverOutlineColor,
              "fill-opacity": 0.7
            }
          }
          ]
      };

      if(source){
        if(source.type === 'vector'){
          var url = config.tileServiceUrl + '/tiles/layer/' + layer_id + '/index.json';

          styles.sources['omh-' + layer_id] = {
            "type": "vector",
             url
          };
        }else if(source.type === 'ags'){
          styles.sources['omh-' + layer_id] = {
            "type": "ags",
             url: source.url
          };
        }
      }

      return styles;
    },


    rasterStyleWithOpacity(layer_id, sourceUrl, opacity){

      opacity = opacity / 100;
      var styles = {
          sources: {},
          layers: [
            {
            "id": "omh-raster-" + layer_id,
            "type": "raster",
            "source": "omh-" + layer_id,
            "minzoom": 0,
            "maxzoom": 18,
            "paint": {
              "raster-opacity": opacity
            }
            }
          ]
      };

      styles.sources['omh-' + layer_id] = {
        "type": "raster",
          url: sourceUrl
      };

      return styles;
    },

    defaultRasterStyle(layer_id, sourceUrl){
      return this.rasterStyleWithOpacity(layer_id, sourceUrl, 100);

    },

    legendWithColor(layer, color) {
      var html = '';
      if(layer.data_type == 'point'){
        html = `<div class="omh-legend">
 <div class="point double-stroke" style="background-color: ` + color + `">
 </div>
 <h3>` + layer.name + `</h3>
 </div>
`;

      }else if(layer.data_type  == 'line'){
        html = `<div class="omh-legend">
<div class="block double-stroke" style="height:  4px; background-color: ` + color + `">
</div>
<h3>` + layer.name + `</h3>
</div>`;

      }else if(layer.data_type  == 'polygon'){
        html = `<div class="omh-legend">
 <div class="block double-stroke" style="background-color: ` + color + `">
 </div>
 <h3>` + layer.name + `</h3>
 </div>
`;
     }else {
       html = `<div class="omh-legend">
 <div class="block double-stroke" style="background-color: ` + color + `">
 </div>
 <h3>` + layer.name + `</h3>
 </div>
`;
     }
      return html;
    },

    defaultLegend(layer) {
      return this.legendWithColor(layer, "red");
    },

    rasterLegend(layer) {
      var html = `<div class="omh-legend">\n<h3>` + layer.name + `</h3>\n</div>`;
      return html;
    },

    defaultStyle(layer_id, source) {
      return this.styleWithColor(layer_id, source, "red");
    },

    getMapboxStyle(mapboxid){

      //Note: we are treating a mapbox style as a special type of "source"
      //it will be converted to sources and layers when the map loads by downloading the style json from the Mapbox API
      var style = {
          sources: {},
          layers: [{
            id: 'mapbox-style-placeholder',
            type: 'mapbox-style-placeholder'
          }
          ]
      };

      style.sources[mapboxid] = {
        type: 'mapbox-style',
        mapboxid
      };

      return style;
    }

};