var React = require('react');
var classNames = require('classnames');
var FeatureBox = require('./FeatureBox');
var styles = require('./styles');
var debug = require('../../services/debug')('map');
var isEqual = require('lodash.isequal');
var _debounce = require('lodash.debounce');
var Promise = require('bluebird');
var request = require('superagent-bluebird-promise');
var $ = require('jquery');
var _includes = require('lodash.includes');
var TerraformerGL = require('../../services/terraformerGL.js');
var Radio = require('../forms/radio');
var Formsy = require('formsy-react');

var Reflux = require('reflux');
var StateMixin = require('reflux-state-mixin')(Reflux);
var LocaleStore = require('../../stores/LocaleStore');
var Locales = require('../../services/locales');
var _isequal = require('lodash.isequal');
var _centroid = require('@turf/centroid');



var mapboxgl = {};

if (typeof window !== 'undefined') {
    mapboxgl = require("../../../assets/assets/js/mapbox-gl/mapbox-gl.js");
}


var Map = React.createClass({

  mixins:[StateMixin.connect(LocaleStore)],

  __(text){
    return Locales.getLocaleString(this.state.locale, text);
  },

  propTypes:  {
    center: React.PropTypes.object,
    className: React.PropTypes.string,
    id: React.PropTypes.string,
    maxBounds: React.PropTypes.object,
    maxZoom: React.PropTypes.number,
    minZoom: React.PropTypes.number,
    height: React.PropTypes.string,
    style: React.PropTypes.object,
    glStyle: React.PropTypes.object,
    zoom: React.PropTypes.number,
    keyboard: React.PropTypes.bool,
    year: React.PropTypes.number,
    features:  React.PropTypes.array,
    tileJSONType: React.PropTypes.string,
    tileJSONUrl:  React.PropTypes.string,
    data: React.PropTypes.object,
    interactive: React.PropTypes.bool,
    showPlayButton: React.PropTypes.bool,
    showLogo: React.PropTypes.bool,
    showFeatureInfoEditButtons: React.PropTypes.bool,
    fitBounds: React.PropTypes.array,
    disableScrollZoom: React.PropTypes.bool,
    enableRotation: React.PropTypes.bool,
    navPosition:  React.PropTypes.string,
    baseMap: React.PropTypes.string,
    onChangeBaseMap: React.PropTypes.func,
    insetMap: React.PropTypes.bool,
    hoverInteraction: React.PropTypes.bool,
    interactionBufferSize: React.PropTypes.number,
    hash: React.PropTypes.bool
  },

  contextTypes: {
    router: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      maxZoom: 18,
      minZoom: 5,
      keyboard: false,
      className: '',
      interactive: true,
      showFeatureInfoEditButtons: true,
      showPlayButton: true,
      navPosition: 'top-right',
      baseMap: 'default',
      showLogo: true,
      insetMap: true,
      hoverInteraction: false,
      interactionBufferSize: 10,
      hash: true
    };
  },

  getInitialState() {
    var restoreBounds = null;
    if(this.props.fitBounds){
      restoreBounds = this.props.fitBounds;
    }
    var glStyle = null;
    var interactiveLayers = [];
    if(this.props.glStyle){
       glStyle = JSON.parse(JSON.stringify(this.props.glStyle));
      interactiveLayers = this.getInteractiveLayers(glStyle);
    }
    return {
      id: this.props.id ? this.props.id : 'map',
      selectedFeatures: null,
      selected: false,
      interactive: this.props.interactive,
      glStyle,
      interactiveLayers,
      mapLoaded: false,
      baseMap: this.props.baseMap,
      restoreBounds,
      allowLayersToMoveMap: restoreBounds ? false : true
    };
  },

  shouldComponentUpdate(nextProps, nextState){
    //always update if there is a selection
    //avoids glitch where feature hover doesn't show
    if(this.state.selected || nextState.selected
    || this.state.selectedFeatures || nextState.selectedFeatures){
      return true;
    }

    //only update if something changes
    if(!_isequal(this.props, nextProps)){
      return true;
    }
    if(!_isequal(this.state, nextState)){
      return true;
    }
    //debug('(' + this.state.id + ') ' + ' shouldComponentUpdate: no need to update');
    return false;
  },

  getPosition(){
    if(this.map){
      var center =this.map.getCenter();
      var zoom = this.map.getZoom();
      return {
          zoom,
          lng: center.lng,
          lat: center.lat
      };
    }
  },

  getBounds(){
    if(this.map){
      return this.map.getBounds().toArray();
    }
  },

  addLayers(map, glStyle){
    var _this = this;
    glStyle.layers.forEach(function(layer){
    try{
      if(layer.type == 'mapbox-style-placeholder'){
        _this.mbstyle.layers.forEach(function(mbStyleLayer){
          if(mbStyleLayer.type !== 'background'){ //ignore the Mapbox Studio background layer
            map.addLayer(mbStyleLayer);
          }
        });
      }else if(layer.metadata && layer.metadata['maphubs:showBehindBaseMapLabels']){
        map.addLayer(layer, 'water');
      }else{
        map.addLayer(layer);
      }

    }catch(err){
      debug('(' + _this.state.id + ') ' +'Failed to add layer: ' + layer.id);
      debug('(' + _this.state.id + ') ' +err);
    }
    });
  },

  removeAllLayers(prevStyle){
    var _this = this;
    if(prevStyle && prevStyle.layers){
      prevStyle.layers.forEach(function(layer){
        try{
          if(layer.type == 'mapbox-style-placeholder'){
            _this.mbstyle.layers.forEach(function(mbStyleLayer){
              _this.map.removeLayer(mbStyleLayer.id);
            });
          }else{
            _this.map.removeLayer(layer.id);
          }

        }catch(err){
          debug('(' + _this.state.id + ') ' +'Failed to remove layer: ' + layer.id);
        }
      });
    }

  },

  removeAllSources(prevStyle){
    var _this = this;
      if(prevStyle && prevStyle.sources){
      Object.keys(prevStyle.sources).forEach(function(key) {
          try{
            if(prevStyle.sources[key].type == 'mapbox-style' && _this.mbstyle){
              Object.keys(_this.mbstyle.sources).forEach(function(mbstyleKey) {
                _this.map.removeSource(mbstyleKey);
              });
            }else{
              _this.map.removeSource(key);
            }

          }catch(err){
            debug('(' + _this.state.id + ') ' +'Failed to remove source: ' + key);
          }
      });
    }
  },

  setSelectionFilter(features){
    var _this = this;
    if(this.state.glStyle){
      this.state.glStyle.layers.forEach(function(layer){
        var filter = ['in', "osm_id"];
        features.forEach(function(feature){
          filter.push(feature.properties.osm_id);
        });
        if(layer.id.startsWith('omh-hover-point')){
          _this.map.setFilter(layer.id,  ["all", ["in", "$type", "Point"], filter]);
        }else if(layer.id.startsWith('omh-hover-line')){
          _this.map.setFilter(layer.id,  ["all", ["in", "$type", "LineString"], filter]);
        }else if(layer.id.startsWith('omh-hover-polygon')){
          _this.map.setFilter(layer.id,  ["all", ["in", "$type", "Polygon"], filter]);
        }
      });
    }

  },

  clearSelectionFilter(){
    var _this = this;
    if(this.state.glStyle){
      this.state.glStyle.layers.forEach(function(layer){
        if(layer.id.startsWith('omh-hover')){
          _this.map.setFilter(layer.id,  ["==", "osm_id", ""]);
        }
      });
    }
  },

  reload(prevStyle, newStyle, baseMap=null){
    var _this = this;
    debug('(' + _this.state.id + ') ' +'reload: start');
    //clear selected when reloading
    try{
      this.clearSelection();
    }catch(err){
      debug(err);
    }

    //if no style is provided assume we are reloading the active style
    if(!prevStyle) prevStyle = this.props.glStyle;
    if(!newStyle) newStyle = prevStyle;
    this.removeAllLayers(prevStyle);
    this.removeAllSources(prevStyle);
    if(baseMap){
      debug('(' + _this.state.id + ') ' +'reload: base map');
      this.map.setStyle(baseMap);
      //map data is loaded when style.load handler is called
    }else {
      this.addMapData(this.map, newStyle, this.props.data, function(){
        debug('(' + _this.state.id + ') ' +'reload: finished adding data');
      });
    }

  },

  reloadInset(mapName){
    debug("reloading inset map with basemap: " + mapName);
    var _this = this;
    this.getBaseMapFromName(mapName, function(baseMap){
      if(_this.props.insetMap && _this.insetMap){
        _this.insetMap.setStyle(baseMap);
      }
    });

  },

  getInteractiveLayers(glStyle){
    var interactiveLayers = [];
    if(glStyle){
      glStyle.layers.forEach(function(layer){
        if(layer.metadata && layer.metadata['maphubs:interactive'] &&
          (layer.id.startsWith('omh')
          || layer.id.startsWith('osm'))
        ){
          interactiveLayers.push(layer.id);
        }
      });
    }
    return interactiveLayers;
  },

  componentWillMount(){
    if(this.state.glStyle){
      var interactiveLayers = this.getInteractiveLayers(this.state.glStyle);
      this.setState({interactiveLayers});
    }
  },

  componentDidMount() {
    this.createMap();

    $(this.refs.basemapButton).show();
    $(this.refs.editBaseMapButton).show();
    if(this.refs.insetMap){
      $(this.refs.insetMap).show();
    }
    $('.base-map-tooltip').tooltip();
  },


  getGeoJSONFromBounds(bounds){
    var v1 = bounds.getNorthWest().toArray();
    var v2 = bounds.getNorthEast().toArray();
    var v3 = bounds.getSouthEast().toArray();
    var v4 = bounds.getSouthWest().toArray();
    var v5 = v1;
    return {
      type: 'FeatureCollection',
      features: [{
          type: 'Feature',
          properties: {name: 'bounds'},
          geometry: {
              type: "Polygon",
              coordinates: [
                [ v1,v2,v3,v4,v5 ]
              ]
            }
      }]
    };
  },

  //give the bounds, determine if the inset location is too small and should be a point instead of the polygon
  showInsetAsPoint(){
    if(this.map){
      var zoom = this.map.getZoom();
      if(zoom > 9){
        return true;
      }
    }
    return false;
  },

  updateInsetGeomFromBounds(bounds){
    var insetGeoJSONData = this.insetMap.getSource("inset-bounds");
    var insetGeoJSONCentroidData = this.insetMap.getSource("inset-centroid");
    if(insetGeoJSONData){
      try{
        var geoJSONBounds = this.getGeoJSONFromBounds(bounds);
        geoJSONBounds.features[0].properties = {'v': 1};
        insetGeoJSONData.setData(geoJSONBounds);
        var geoJSONCentroid = _centroid(geoJSONBounds);
        geoJSONCentroid.properties = {'v': 1};
        insetGeoJSONCentroidData.setData(geoJSONCentroid);
        this.setState({insetGeoJSONData, insetGeoJSONCentroidData});

        if(this.showInsetAsPoint()){
          this.insetMap.setFilter('center', ['==', 'v', 1]);
          this.insetMap.setFilter('bounds', ['==', 'v', 2]);
        } else {
          this.insetMap.setFilter('center', ['==', 'v', 2]);
          this.insetMap.setFilter('bounds', ['==', 'v', 1]);
        }

        this.insetMap.fitBounds(bounds, {maxZoom: 1.8, padding: 10, animate: false});
      }catch(err){
          debug(err);
      }
    }
  },

  addMapData(map, glStyle, geoJSON, cb){
    var _this = this;
    if(glStyle && glStyle.sources){
      var requests = [];
      Object.keys(glStyle.sources).forEach(function(key) {
        var source = glStyle.sources[key];
        var type = source.type;
        var url = source.url;
        if(key != 'osm' && type === 'vector' && !url.startsWith('mapbox://')  ){
          //load as tilejson
          url = url.replace('{MAPHUBS_DOMAIN}', MAPHUBS_CONFIG.tileServiceUrl);
          requests.push(request.get(url)
          .then(function(res) {
            var tileJSON = res.body;
            tileJSON.type = 'vector';

            map.on('source.load', function(e) {
              if (e.source.id === key && _this.state.allowLayersToMoveMap) {
                debug('Zooming map extent of source: ' + e.source.id);
                map.fitBounds([[tileJSON.bounds[0], tileJSON.bounds[1]],
                               [tileJSON.bounds[2], tileJSON.bounds[3]]]);
              }
            });
            map.addSource(key, tileJSON);
          }, function(error) {
           debug('(' + _this.state.id + ') ' +error);
          })
        );
      } else if(type === 'mapbox-style'){
        var mapboxid = source.mapboxid;
        url = 'https://api.mapbox.com/styles/v1/' + mapboxid + '?access_token=' + MAPHUBS_CONFIG.MAPBOX_ACCESS_TOKEN;
        requests.push(request.get(url)
          .then(function(res) {
            var mbstyle = res.body;
            _this.mbstyle = mbstyle;

            //TODO: not sure if it is possible to combine sprites/glyphs sources yet, so this doesn't work with all mapbox styles

            //add sources
            Object.keys(mbstyle.sources).forEach(function(key) {
              var source = mbstyle.sources[key];
              map.on('source.load', function(e) {
                if (e.source.id === key && this.state.allowLayersToMoveMap) {
                  //map.flyTo({center: mbstyle.center, zoom:mbstyle.zoom});
                }
              });
              map.addSource(key, source);
            });
          })
        );


      } else if(type === 'ags-mapserver-query'){
        requests.push(TerraformerGL.getArcGISGeoJSON(url)
        .then(function(geoJSON) {

          if(geoJSON.bbox && geoJSON.bbox.length > 0 && _this.state.allowLayersToMoveMap){
            _this.zoomToData(geoJSON);
          }

          var geoJSONSource = new mapboxgl.GeoJSONSource({data: geoJSON});
          map.addSource(key, geoJSONSource);
        }, function(error) {
         debug('(' + _this.state.id + ') ' +error);
        })
      );
    } else if(type === 'ags-featureserver-query'){
      requests.push(TerraformerGL.getArcGISFeatureServiceGeoJSON(url)
      .then(function(geoJSON) {

        if(geoJSON.bbox && geoJSON.bbox.length > 0 && this.state.allowLayersToMoveMap){
          _this.zoomToData(geoJSON);
        }

        var geoJSONSource = new mapboxgl.GeoJSONSource({data: geoJSON});
        map.addSource(key, geoJSONSource);
      }, function(error) {
       debug('(' + _this.state.id + ') ' +error);
      })
    );
  } else {
      //just add the source as-is
      map.addSource(key, source);
    }

      });
      //once all sources are loaded then load the layers
      Promise.all(requests).then(function(){
        _this.addLayers(map, glStyle);
        cb();
      }).catch(function(err){
        debug('(' + _this.state.id + ') ' +err);
        //try to load the map anyway
        _this.addLayers(map, glStyle);
        cb();
      });
    }
    else if(geoJSON){
      _this.initGeoJSON(map, geoJSON);
    }
    else{
      _this.setState({mapLoaded: true});
    }
  },

  createMap() {
    var _this = this;
    debug('(' + _this.state.id + ') ' +'Creating MapboxGL Map');
    mapboxgl.accessToken = MAPHUBS_CONFIG.MAPBOX_ACCESS_TOKEN;
      this.getBaseMapFromName(this.state.baseMap, function(baseMap){
        var dragRotate  = false;
        if(!_this.props.enableRotation){
          dragRotate = true;
        }

        if (!mapboxgl.supported()) {
        alert('Your browser does not support Mapbox GL');
        }
      var map = new mapboxgl.Map({
        container: _this.state.id,
        style: baseMap,
        zoom: 0,
        interactive: _this.state.interactive,
        dragRotate,
        center: [0,0],
        hash: _this.props.hash
      });



  map.on('style.load', function() {
    debug('(' + _this.state.id + ') ' +'style.load');
   //add the omh data
    _this.addMapData(map, _this.state.glStyle, _this.props.data, function(){
      //do stuff that needs to happen after data loads
      debug('(' + _this.state.id + ') ' +'finished adding map data');
      if(!_this.props.data){

        if (_this.state.restoreBounds){
          var fitBounds = _this.state.restoreBounds;
          if(fitBounds.length > 2){
            var sw = new mapboxgl.LngLat(fitBounds[0], fitBounds[1]);
            var ne = new mapboxgl.LngLat(fitBounds[2], fitBounds[3]);
            fitBounds = new mapboxgl.LngLatBounds(sw, ne);
          }
          debug('(' + _this.state.id + ') ' +'restoring bounds: ' + _this.state.restoreBounds);
          map.fitBounds(fitBounds, {animate:false});
          if(_this.insetMap){
            _this.insetMap.fitBounds(fitBounds, {maxZoom: 1.8, padding: 10, animate:false});
          }

        }else{
          debug('(' + _this.state.id + ') ' +'No restoreBounds found');
        }

      }else{
        debug('(' + _this.state.id + ') ' +'Not restoring bounds for GeoJSON data');
      }


      if(_this.state.locale != 'en'){
        _this.changeLocale(_this.state.locale, _this.map);
        if(_this.insetMap){
           _this.changeLocale(_this.state.locale, _this.insetMap);
        }

      }
      debug('(' + _this.state.id + ') ' +'MAP LOADED');
      _this.setState({mapLoaded: true});
    });

/*
    map.on('error', function(e){
      debug('(' + _this.state.id + ') ' +e.type);
    });

    map.on('tile.error', function(e){
      debug('(' + _this.state.id + ') ' +e.type);
    });
*/
    if(_this.props.insetMap && !_this.insetMap){
      var center = map.getCenter();
      var insetMap =  new mapboxgl.Map({
        container: _this.state.id + '_inset',
        style: baseMap,
        zoom: 0,
        interactive: false,
        center
      });

      insetMap.on('style.load', function() {

        var bounds = map.getBounds();
        insetMap.fitBounds(bounds, {maxZoom: 1.8, padding: 10});
        //create geojson from bounds
        var geoJSON = _this.getGeoJSONFromBounds(bounds);
        geoJSON.features[0].properties = {'v': 1};
        var geoJSONCentroid = _centroid(geoJSON);
        geoJSONCentroid.properties = {'v': 1};
        insetMap.addSource("inset-bounds", {"type": "geojson", data:geoJSON});
        insetMap.addSource("inset-centroid", {"type": "geojson", data:geoJSONCentroid});
        insetMap.addLayer({
            'id': 'bounds',
            'type': 'line',
            'source': 'inset-bounds',
            'paint': {
                'line-color': 'rgb(244, 118, 144)',
                'line-opacity': 0.75,
                'line-width': 5
            }
        });

        insetMap.addLayer({
            'id': 'center',
            'type': 'circle',
            'source': 'inset-centroid',
            'paint': {
                'circle-color': 'rgb(244, 118, 144)',
                'circle-opacity': 0.75
            }
        });

        if(_this.showInsetAsPoint()){
          insetMap.setFilter('center', ['==', 'v', 1]);
          insetMap.setFilter('bounds', ['==', 'v', 2]);
        } else {
          insetMap.setFilter('center', ['==', 'v', 2]);
          insetMap.setFilter('bounds', ['==', 'v', 1]);
        }

      });
      _this.insetMap = insetMap;

      map.on('moveend', function(){
        if(_this.props.insetMap){
          _this.updateInsetGeomFromBounds(map.getBounds());
        }
      });
    }


  });//end style.load


map.on('mousemove', function(e) {
    if(_this.state.showBaseMaps) return;

    var debounced = _debounce(function(){
      if(_this.state.mapLoaded && _this.state.restoreBounds){
        debug('(' + _this.state.id + ') ' +"clearing restoreBounds");
        _this.setState({restoreBounds:null});
        //stop restoring map possition after user has moved the map
      }

      var features = map.queryRenderedFeatures(
        [
          [e.point.x - _this.props.interactionBufferSize / 2, e.point.y - _this.props.interactionBufferSize / 2],
          [e.point.x + _this.props.interactionBufferSize / 2, e.point.y + _this.props.interactionBufferSize / 2]
        ],
      {layers: _this.state.interactiveLayers});

      if (features.length) {
        if(_this.state.selected){
          $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', 'crosshair');
        } else if(_this.props.hoverInteraction){
          $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', 'crosshair');
           _this.setSelectionFilter(features);
           _this.setState({selectedFeatures:features});
           map.addClass('selected');
        }else{
           $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', 'pointer');
        }
       } else if(!_this.state.selected && _this.state.selectedFeatures != null) {
           _this.clearSelection();
           $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', '');
       } else {
         $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', '');
       }

    }, 200).bind(this);
    debounced();

 });



 map.on('click', function(e) {
    if(!_this.state.selected &&_this.state.selectedFeatures && _this.state.selectedFeatures.length > 0){
     _this.setState({selected:true});
   }else{
     $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', 'crosshair');

     var features = map.queryRenderedFeatures(
       [
        [e.point.x - _this.props.interactionBufferSize / 2, e.point.y - _this.props.interactionBufferSize / 2],
        [e.point.x + _this.props.interactionBufferSize / 2, e.point.y + _this.props.interactionBufferSize / 2]
      ], {layers: _this.state.interactiveLayers});

     if (features.length) {
       if(_this.state.selected){
        _this.clearSelection();
      }
      _this.setSelectionFilter(features);
      _this.setState({selectedFeatures:features, selected:true});
       map.addClass('selected');
      } else if(_this.state.selectedFeatures != null) {
          _this.clearSelection();
          _this.setState({selected: false});
          $(_this.refs.map).find('.mapboxgl-canvas-container').css('cursor', '');
      }

   }
  });


  if(_this.state.interactive){
    map.addControl(new mapboxgl.NavigationControl(), _this.props.navPosition);
  }

  map.addControl(new mapboxgl.ScaleControl({
      maxWidth: 175,
      unit: 'metric' //TODO: let scalebar unit be a user preference
  }), 'bottom-right');

  if(_this.props.disableScrollZoom){
    map.scrollZoom.disable();
  }

  if(!_this.props.enableRotation){
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
  }

  //var Geocoder = require('mapbox-gl-geocoder');
  //map.addControl(new Geocoder({position: 'top-right'}));

  _this.map = map;
  });

  },

  clearSelection(){

    if(this.map.hasClass('selected')){
      this.map.removeClass('selected');
    }

    this.clearSelectionFilter();
    this.setState({selectedFeatures:null});
  },



  shouldUpdateCenter(next, prev) {
    if (!prev) return true;
    next = this.normalizeCenter(next);
    prev = this.normalizeCenter(prev);
    return next[0] !== prev[0] || next[1] !== prev[1];
  },

  componentDidUpdate(prevProps, prevState) {
    var center = this.props.center;
    var zoom = this.props.zoom;
    if (center && this.shouldUpdateCenter(center, prevProps.center)) {
      debug('(' + this.state.id + ') ' +'updating map center to: ' + center);
      this.map.setView(center, zoom, {animate: false});
    }
    else if (zoom && zoom !== prevProps.zoom) {
      debug('(' + this.state.id + ') ' +'updating map zoom to: ' + zoom);
      this.map.setZoom(zoom);
    }

    if(this.state.interactive && !prevState.interactive){
      this.map.addControl(new mapboxgl.Navigation(), this.props.navPosition);
      var interaction = this.map.interaction;
      interaction.enable();
      $(this.refs.basemapButton).show();
      $(this.refs.editBaseMapButton).show();
    }

      if(this.state.locale && (this.state.locale != prevState.locale) ){
        this.changeLocale(this.state.locale, this.map);
        if(this.insetMap){
           this.changeLocale(this.state.locale, this.insetMap);
        }
      }
  },

  componentWillReceiveProps(nextProps){
    //debug('(' + this.state.id + ') ' +'componentWillReceiveProps');
    var _this = this;
    if(nextProps.data){
      var geoJSONData = this.map.getSource("omh-geojson");
      if(geoJSONData){
        debug('(' + this.state.id + ') ' +'update geoJSON data');
        //update existing data
        geoJSONData.setData(nextProps.data);
        this.zoomToData(nextProps.data);
      }else if(geoJSONData === undefined && this.props.data){
        //do nothing, still updating from the last prop change...
      }else {
        debug('(' + this.state.id + ') ' +'init geoJSON data');
        this.initGeoJSON(this.map, nextProps.data);
      }
    }

    var fitBoundsChanging = false;
    var bounds = null;
    var allowLayersToMoveMap = this.state.allowLayersToMoveMap;

    if(nextProps.fitBounds && !isEqual(this.props.fitBounds,nextProps.fitBounds)){
      debug('(' + this.state.id + ') ' +'FIT BOUNDS CHANGING');
      fitBoundsChanging = true;
      allowLayersToMoveMap = false;
      if(nextProps.fitBounds.length > 2){
        var sw = new mapboxgl.LngLat(nextProps.fitBounds[0], nextProps.fitBounds[1]);
        var ne = new mapboxgl.LngLat(nextProps.fitBounds[2], nextProps.fitBounds[3]);
        bounds = new mapboxgl.LngLatBounds(sw, ne);
      }else{
        bounds = nextProps.fitBounds;
      }
      debug('(' + this.state.id + ') ' +'bounds: ' + bounds);
    }

    if(nextProps.glStyle && nextProps.baseMap) {
      if(!isEqual(this.state.glStyle,nextProps.glStyle)) {
          debug('(' + this.state.id + ') ' +'glstyle changing from props');
          //** Style Changing (also reloads basemap) **/
          if(this.state.mapLoaded && !fitBoundsChanging) {
            //if fitBounds isn't changing, restore the current map position
            if(this.state.glStyle != null){
              debug('(' + this.state.id + ') ' +"restoring current map position");
              allowLayersToMoveMap = false;
            }

          }
          this.setState({baseMap: nextProps.baseMap, allowLayersToMoveMap});
          this.getBaseMapFromName(nextProps.baseMap, function(baseMapUrl){
            //clone the style object otherwise it is impossible to detect updates made to the object outside this component...
            let styleCopy = JSON.parse(JSON.stringify(nextProps.glStyle));
            _this.reload(_this.state.glStyle, styleCopy, baseMapUrl);

            var interactiveLayers = _this.getInteractiveLayers(styleCopy);

            _this.setState({glStyle: styleCopy, interactiveLayers});//wait to change state style until after reloaded
          });


      }else if(!isEqual(this.state.baseMap,nextProps.baseMap)) {
        //** Style Not Changing, but Base Map is Changing **/
        debug('(' + this.state.id + ') ' +"basemap changing from props");
        allowLayersToMoveMap = false;
        this.setState({baseMap: nextProps.baseMap, allowLayersToMoveMap});
        this.getBaseMapFromName(nextProps.baseMap, function(baseMapUrl){
          _this.reload(_this.state.glStyle, _this.state.glStyle, baseMapUrl);
        });

      }else if(fitBoundsChanging) {
        //** just changing the fit bounds
        //in this case we can fitBounds directly since we are not waiting for the map to reload styles first
        if(bounds){
          debug('(' + this.state.id + ') ' +'only bounds changing, bounds: ' + bounds);
          if(bounds._ne && bounds._sw){
            debug('(' + this.state.id + ') ' +'calling map fitBounds');
            this.map.fitBounds(bounds, {animate:false});
            if(this.insetMap){
              this.insetMap.fitBounds(bounds, {maxZoom: 1.8, padding: 10, animate:false});
            }
           }else if(Array.isArray(bounds) && bounds.length > 2){
             debug('(' + this.state.id + ') ' +'calling map fitBounds');
             this.map.fitBounds([[bounds[0], bounds[1]],
                           [bounds[2], bounds[3]]], {animate:false});
             if(this.insetMap){
               this.insetMap.fitBounds(bounds, {maxZoom: 1.8, padding: 10, animate:false});
             }
           }else{
             debug('(' + this.state.id + ') ' +'calling map fitBounds');
             this.map.fitBounds(bounds, {animate:false});
             if(this.insetMap){
               this.insetMap.fitBounds(bounds, {maxZoom: 1.8, padding: 10, animate:false});
             }
           }
           this.setState({allowLayersToMoveMap});
        }else{
          debug('(' + this.state.id + ') ' +'Warning: Null bounds when fit bounds is changing');
        }

     }else{
       //debug('(' + this.state.id + ') ' +'No changes needed in props update');
     }

    }else if(nextProps.glStyle
      && !isEqual(this.state.glStyle,nextProps.glStyle)){
        //** Style Changing (no basemap provided) **/
        debug('(' + this.state.id + ') ' +'glstyle changing from props (default basemap)');

        //clone the style object otherwise it is impossible to detect updates made to the object outside this component...
        let styleCopy = JSON.parse(JSON.stringify(nextProps.glStyle));
        this.reload(this.state.glStyle, styleCopy);

        var interactiveLayers = this.getInteractiveLayers(styleCopy);

        this.setState({glStyle: styleCopy, allowLayersToMoveMap, interactiveLayers}); //wait to change state style until after reloaded

    }else if(nextProps.baseMap
      && !isEqual(this.state.baseMap,nextProps.baseMap)) {
        //** Style Not Found, but Base Map is Changing **/
        debug('(' + this.state.id + ') ' +'basemap changing from props (no glstyle)');

      this.setState({baseMap: nextProps.baseMap, allowLayersToMoveMap});
      this.getBaseMapFromName(nextProps.baseMap, function(baseMapUrl){
        _this.reload(this.state.glStyle, this.state.glStyle, baseMapUrl);
      });

    }else if(fitBoundsChanging) {
      //** just changing the fit bounds on a map that does not have styles or basemap settings **/
      //in this case we can fitBounds directly since we are not waiting for the map to reload styles first
      if(bounds){
        debug('(' + this.state.id + ') ' +'only bounds changing');
        if(bounds._ne && bounds._sw){
         this.map.fitBounds(bounds, {animate:false});
         }else if(Array.isArray(bounds) && bounds.length > 2){
           this.map.fitBounds([[bounds[0], bounds[1]],
                         [bounds[2], bounds[3]]], {animate:false});
         }else{
           this.map.fitBounds(bounds, {animate:false});
         }
         this.setState({allowLayersToMoveMap});
      }else{
        debug('(' + this.state.id + ') ' +'Warning: Null bounds when fit bounds is changing');
      }

   }else{
     debug('(' + this.state.id + ') ' +'No changes needed in props update');
   }
  },

  initGeoJSON(map, data){
    if(data && data.features && data.features.length > 0){
      map.addSource("omh-geojson", {"type": "geojson", data});
      var glStyle = styles.defaultStyle('geojson', null, null);
      delete glStyle.sources; //ignore the tilejson source
      this.addLayers(map, glStyle);

      var interactiveLayers = this.getInteractiveLayers(glStyle);

      this.setState({interactiveLayers, glStyle});
      this.zoomToData(data);
    } else {
      //empty data
      debug('(' + this.state.id + ') ' +'Empty/Missing GeoJSON Data');
    }
  },

  resetGeoJSON(){
    var geoJSONData = this.map.getSource("omh-geojson");
    geoJSONData.setData({
      type: 'FeatureCollection',
      features: []
    });
    this.map.flyTo({center: [0,0], zoom:0});
  },

  changeLocale(locale, map){
    var supportedLangauges = ['en', 'fr', 'es', 'de', 'de', 'ru', 'zh'];
    var foundLocale = _includes(supportedLangauges, locale);
    if(!foundLocale){
      //Mapbox vector tiles currently only have en,es,fr,de,ru,zh
      locale = 'en';
    }
    debug('(' + this.state.id + ') ' +'changing map language to: ' + locale);
    try{
    map.setLayoutProperty('country-label-lg', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('country-label-md', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('country-label-sm', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('state-label-lg', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_point_other', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_point_3', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_point_2', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_point_1', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_line_other', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_line_3', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_line_2', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('marine_label_line_1', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_neighborhood', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_other', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_small_s', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_small_n', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_medium_s', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_medium_n', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_large_s', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('place_label_city_large_n', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('road-label-sm', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('road-label-med', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('road-label-large', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('airport-label', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('poi-parks-scalerank1', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('poi-scalerank1', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('waterway-label', 'text-field', '{name_' + locale + '}');
    map.setLayoutProperty('water-label', 'text-field', '{name_' + locale + '}');
    }catch(err){
      debug(err);
    }


  },

  zoomToData(data){
    if(data.bbox && data.bbox.length > 0){
      var bbox = data.bbox;
      var sw = new mapboxgl.LngLat(bbox[0], bbox[1]);
      var ne = new mapboxgl.LngLat(bbox[2], bbox[3]);
      var llb = new mapboxgl.LngLatBounds(sw, ne);
      this.map.fitBounds(llb, {padding: 25, curve: 3, speed:0.6, maxZoom: 12});
    }
  },

  flyTo(center, zoom){
    this.map.flyTo({center, zoom});
  },

  getBoundsObject(bbox){
    var sw = new mapboxgl.LngLat(bbox[0], bbox[1]);
    var ne = new mapboxgl.LngLat(bbox[2], bbox[3]);
    return new mapboxgl.LngLatBounds(sw, ne);
  },

  fitBounds(bbox, maxZoom, padding = 0, animate = true){
    var sw = new mapboxgl.LngLat(bbox[0], bbox[1]);
    var ne = new mapboxgl.LngLat(bbox[2], bbox[3]);
    var llb = new mapboxgl.LngLatBounds(sw, ne);
    this.map.fitBounds(llb, {padding, curve: 1, speed:0.6, maxZoom, animate});
  },

  componentWillUnmount() {
    this.map.remove();
  },

  updatePosition() {
    debug('(' + this.state.id + ') ' +'UPDATE POSITION');
    var map = this.map;
    map.setView(this.state.map.position.center, this.state.map.position.zoom, {animate: false});
  },

  handleUnselectFeature() {
    this.setState({selected:false});
    this.clearSelection();
  },

  startInteractive(){
    this.setState({interactive: true});
    if(!this.props.enableRotation){
      this.map.dragRotate.disable();
      this.map.touchZoomRotate.disableRotation();
    }
  },

  toggleBaseMaps(){
    if(this.state.showEditBaseMap){
      this.closeEditBaseMap();
    }
    if(this.state.showBaseMaps){
      this.closeBaseMaps();
    }else{
      this.setState({showBaseMaps: true});
    }
  },

  closeBaseMaps(){
    this.setState({showBaseMaps: false});
  },

  toggleEditBaseMap(){
    if(this.state.showBaseMaps){
      this.closeBaseMaps();
    }
    if(this.state.showEditBaseMap){
      this.closeEditBaseMap();
    }else{
      this.setState({showEditBaseMap: true});
    }
  },

  closeEditBaseMap(){
    this.setState({showEditBaseMap: false});
  },

  getBaseMapFromName(mapName, cb){
    var mapboxName = 'light-v9';
    var optimize = true;

    if (mapName == 'default') {
        mapboxName = 'light-v9';
        optimize = true;
    }
    else if(mapName == 'dark'){
      mapboxName = 'dark-v9';
      optimize = true;
    }
    else if(mapName == 'outdoors'){
      mapboxName = 'outdoors-v9';
      optimize = true;
    }
    else if(mapName == 'streets'){
      mapboxName = 'streets-v9';
      optimize = true;
    }
    else if(mapName == 'mapbox-satellite'){
      mapboxName = 'satellite-streets-v9';
      optimize = true;
    }
    var url = 'mapbox://styles/mapbox/' + mapboxName;
    if(optimize){
      url += '?optimize=true'; //requires mapbox-gl-js 0.24.0+
    }
    cb(url);
    /*
    var url = 'https://api.mapbox.com/styles/v1/mapbox/' + mapboxName + '?';
    if(optimize){
      //url += 'optimize=true&';
    }
    url += 'access_token=' + MAPHUBS_CONFIG.MAPBOX_ACCESS_TOKEN;
    request.get(url)
    .then(function(res) {
      cb(res.body);
    });
    */
  },

  getBaseMap(){
    return this.state.baseMap;
  },

  changeBaseMap(mapName){
    debug('changing basemap to: ' + mapName);
    $('.base-map-tooltip').tooltip('remove'); //fix stuck tooltips
    $('.base-map-tooltip').tooltip();
    var _this = this;
    this.getBaseMapFromName(mapName, function(baseMapUrl){
      _this.closeBaseMaps();
      _this.setState({baseMap: mapName, allowLayersToMoveMap: false});
      _this.reload(_this.state.glStyle, _this.state.glStyle, baseMapUrl);
      _this.reloadInset(mapName);
      if(_this.props.onChangeBaseMap){
        _this.props.onChangeBaseMap(mapName);
      }
    });

  },

  render() {

    var className = classNames('mode', 'map', 'active');

    var featureBox = '';
    if(this.state.selectedFeatures && this.state.selectedFeatures.length > 0){
      featureBox = (
        <FeatureBox
            features={this.state.selectedFeatures}
            selected={this.state.selected}
            onUnselected={this.handleUnselectFeature}
            showButtons={this.props.showFeatureInfoEditButtons}
            style={{}}
        />
      );
    }

    var style = {};
    if(this.props.style){
      style = this.props.style;
    }

    var interactiveButton = '';
    if(!this.state.interactive && this.props.showPlayButton){
      interactiveButton = (
        <a onClick={this.startInteractive} className="btn-floating waves-effect waves-light"
          style={{position: 'absolute', left: '50%', bottom: '50%', backgroundColor: 'rgba(25,25,25,0.1)',  zIndex: '999'}}><i className="material-icons">play_arrow</i></a>
      );
    }

    var logo = '', children = '';
    if(this.state.mapLoaded && this.props.showLogo){
      logo = (
        <img style={{position:'absolute', left: '5px', bottom: '2px', zIndex: '1'}} width={MAPHUBS_CONFIG.logoSmallWidth} height={MAPHUBS_CONFIG.logoSmallHeight} src={MAPHUBS_CONFIG.logoSmall} alt="Logo"/>
      );
      children = this.props.children;
    }

    var baseMapBox = '';
    if(this.state.showBaseMaps){
      var baseMapOptions = [
        {value: 'default', label: this.__('Default')},
        {value: 'dark', label: this.__('Dark')},
        {value: 'streets', label: this.__('Streets')},
        {value: 'outdoors', label: this.__('Outdoors')},
        {value: 'mapbox-satellite', label: this.__('Satellite')}
      ];
      baseMapBox = (
        <div className="features z-depth-1" style={{width: '140px', marginRight: '10px', backgroundColor: 'white', textAlign: 'center'}}>
          <Formsy.Form>
          <h6>{this.__('Base Maps')}</h6>
          <Radio name="baseMap" label=""
              defaultValue={this.state.baseMap}
              options={baseMapOptions} onChange={this.changeBaseMap}
            />
          </Formsy.Form>
        </div>
      );
    }

    var editBaseMapBox = '';
    if(this.state.showEditBaseMap){
      var origHash = window.location.hash.replace('#', '');
      var hashParts = origHash.split('/');
      var zoom =  Math.round(hashParts[0]);
      var lon = hashParts[1];
      var lat = hashParts[2];
      var osmEditLink = 'https://www.openstreetmap.org/edit#map=' + zoom + '/' + lon + '/' + lat;
      var loggingRoadsEditLink = 'http://id.loggingroads.org/#map=' + zoom + '/' + lat + '/' + lon;
      editBaseMapBox = (
        <div className="features z-depth-1" style={{width: '240px', textAlign: 'center'}}>
            <ul className="collection with-header custom-scroll-bar" style={{margin: 0, width: '100%', overflow: 'auto'}}>
              <li className="collection-header">
                <h6>{this.__('Edit Base Map Data')}</h6>
              </li>
             <li className="collection-item">
               <a className="btn" target="_blank" href={osmEditLink} onClick={this.toggleEditBaseMap}>{this.__('OpenStreetMap')}</a>
             </li>
             <li className="collection-item">
               <a className="btn" target="_blank" href={loggingRoadsEditLink} onClick={this.toggleEditBaseMap}>{this.__('LoggingRoads')}</a>
             </li>
           </ul>



        </div>
      );
    }

    var baseMapButton = '', editBaseMapButton = '';
    if(this.state.interactive){
      baseMapButton = (
        <a
          onClick={this.toggleBaseMaps}
          style={{position: 'absolute',
            top: '10px',
            right: '10px',
            height:'30px',
            zIndex: '100',
            lineHeight: '30px',
            textAlign: 'center',
            width: '30px'}}
          >
          <i className="material-icons z-depth-1 base-map-tooltip"
            ref="basemapButton"
            style={{height:'30px',
                    lineHeight: '30px',
                    display: 'none',
                    width: '30px',
                    color: MAPHUBS_CONFIG.primaryColor,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    borderColor: '#ddd',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    textAlign: 'center',
                    fontSize:'25px'}}
            data-position="bottom" data-delay="50" data-tooltip={this.__('Change Base Map')}
            >layers</i>
        </a>
      );

      editBaseMapButton = (
        <a
          onClick={this.toggleEditBaseMap}
          style={{position: 'absolute',
            top: '10px',
            right: '45px',
            height:'30px',
            zIndex: '100',
            lineHeight: '30px',
            textAlign: 'center',
            width: '30px'}}
          >
          <i className="material-icons z-depth-1 base-map-tooltip"
            ref="editBaseMapButton"
            style={{height:'30px',
                    lineHeight: '30px',
                    display: 'none',
                    width: '30px',
                    color: MAPHUBS_CONFIG.primaryColor,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    borderColor: '#ddd',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    textAlign: 'center',
                    fontSize:'25px'}}
            data-position="bottom" data-delay="50" data-tooltip={this.__('Edit Base Map')}
            >edit</i>
        </a>
      );

    }

    var inset = '';
    if(this.props.insetMap){
      inset = (
        <div style={{
          position: 'absolute', bottom: '30px', left: '5px',
          minHeight: '100px', maxHeight: '145px', minWidth: '100px', maxWidth: '145px',
          height: '25vw', width: '25vw'
          }}>
          <div id={this.state.id + '_inset'} ref="insetMap" className="map z-depth-1"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'none',
              border: '0.5px solid rgba(222,222,222,50)', zIndex: 1
            }}></div>
        </div>

      );
    }


    return (
      <div ref="mapcontainer" className={this.props.className} style={style}>
        <div id={this.state.id} ref="map" className={className} style={{width:'100%', height:'100%'}}>
          {inset}
          {editBaseMapButton}
          {baseMapButton}
          {baseMapBox}
          {editBaseMapBox}
          {featureBox}
          {interactiveButton}
          {children}
          {logo}
        </div>
        </div>
    );
  }
});

module.exports = Map;