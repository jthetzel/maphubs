//@flow
import Reflux from 'reflux';
import Actions from '../actions/LayerActions';
import PresetActions from '../actions/presetActions';
var request = require('superagent');
var MapStyles = require('../components/Map/Styles');
var urlUtil = require('../services/url-util');
var checkClientError = require('../services/client-error-response').checkClientError;
var debug = require('../services/debug')('layer-store');
import _findIndex from 'lodash.findindex';


export type Layer = {
  layer_id?: number,
  name?: string,
  description?: string,
  source?: string,  
  style?: ?Object,
  labels?: Object,
  settings?: {
    active: boolean
  },
  presets?: Object,
  preview_position?: Object,
  data_type?: string,
  legend_html?: ?string,
  license?: string,
  owned_by_group_id?: ?string,
  private?: boolean,
  is_external?: boolean,
  external_layer_type?: string,
  external_layer_config?: Object,
  is_empty?: boolean,
  complete?: boolean,
  status?: string,
  mapColor?: string,
  tileServiceInitialized?: boolean,
  pendingChanges?: boolean
}

let emptyLayer: Layer = {
    layer_id: -1,
    name: '',
    description: '',
    published: true,
    owned_by_group_id: null,
    data_type: '',
    source: '',
    license: 'none',
    preview_position: {
      zoom: 1,
      lat: 0,
      lng: 0,
      bbox: [[-180,-180],[180,180]]
    } ,
    style: null,
    legend_html: null,
    is_external: false,
    external_layer_type: '',
    external_layer_config: {},
    complete: false,
    private: false,
    mapColor: '#FF0000',
    tileServiceInitialized: false,
    pendingChanges: false
};

export type LayerStoreState =  Layer

export default class LayerStore extends Reflux.Store<void, void, Layer> {

  state: LayerStoreState

  constructor(){
    super();
    this.state = emptyLayer;
    this.listenables = Actions;
    this.listenTo(PresetActions.presetsChanged, this.presetsChanged);
  }

  getSourceConfig(){
    var sourceConfig = {
      type: 'vector'
    };
    if(this.state.is_external){
      sourceConfig = this.state.external_layer_config;
    }
    return sourceConfig;
  }

  loadLayer(layer: Object){
    layer.mapColor = this.state.mapColor;
    if(layer.settings && layer.settings.color){
      layer.mapColor = layer.settings.color;
    }
    this.setState(layer);

    if(!this.state.style){
      this.resetStyleGL();
    }

    if(!this.state.legend_html){
      this.resetLegendHTML();
    }
  }

  resetStyleGL(){
    var style = this.state.style ? this.state.style : {"sources": {}};
    var layer_id = this.state.layer_id ? this.state.layer_id: -1;
    var isExternal = this.state.is_external;
    var externalLayerConfig = this.state.external_layer_config ? this.state.external_layer_config : {};
    var externalType = externalLayerConfig.type;
    var baseUrl = urlUtil.getBaseUrl();
    if(isExternal && this.state.external_layer_type === 'mapbox-map'){
      style = MapStyles.raster.defaultRasterStyle(this.state.layer_id, externalLayerConfig.url);
    }else if(isExternal && externalType === 'raster'){
      style = MapStyles.raster.defaultRasterStyle(layer_id, baseUrl + '/api/layer/' + layer_id.toString() +'/tile.json');
    }else if(isExternal && externalType === 'multiraster'){
      style = MapStyles.raster.defaultMultiRasterStyle(layer_id, externalLayerConfig.layers);
    }else if(isExternal && externalType === 'mapbox-style'){
        style = MapStyles.style.getMapboxStyle(externalLayerConfig.mapboxid);
    }else if(isExternal && externalType === 'ags-mapserver-tiles'){
        style = MapStyles.raster.defaultRasterStyle(layer_id, externalLayerConfig.url + '?f=json', 'arcgisraster');
    }else if(isExternal && externalType === 'geojson'){
        style = MapStyles.style.defaultStyle(layer_id, this.getSourceConfig(), externalLayerConfig.data_type);
    }else if(style.sources.osm){
      alert('Unable to reset OSM layers');
      return;
    }else{
      style = MapStyles.style.defaultStyle(layer_id, this.getSourceConfig(), this.state.data_type);
    }
    this.setState({style});
  }

  resetLegendHTML(){
    var legend_html;
    var externalLayerConfig = this.state.external_layer_config;
    if(this.state.is_external
      && externalLayerConfig
      && (externalLayerConfig.type === 'raster'
          || externalLayerConfig.type === 'multiraster'
          || externalLayerConfig.type === 'ags-mapserver-tiles')){
      legend_html = MapStyles.legend.rasterLegend(this.state);
    }else if(this.state.is_external && externalLayerConfig && externalLayerConfig.type === 'mapbox-style'){
      legend_html = MapStyles.legend.rasterLegend(this.state);
    }else{
      legend_html = MapStyles.legend.defaultLegend(this.state);
    }
    this.setState({legend_html});
  }

  resetStyle(){
    this.resetStyleGL();
    this.resetLegendHTML();
    this.trigger(this.state);
  }

  initLayer(layer: Object){
    if(!layer.style){
      layer.style = MapStyles.style.defaultStyle(layer.layer_id, this.getSourceConfig(), layer.data_type);   
    }
    if(!layer.legend_html){
      layer.legend_html = MapStyles.legend.defaultLegend(layer);
    }else{
      this.resetLegendHTML();
    }
   
    if(!layer.preview_position){
      layer.preview_position = {
      zoom: 1,
      lat: 0,
      lng: 0,
      bbox: null
    }; 
    }  
    return layer;
  }

  createLayer(_csrf: string, cb: Function){
    var _this = this;
    request.post('/api/layer/admin/createLayer')
    .type('json').accept('json')
    .send({
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        const layer_id = res.body.layer_id;
        _this.setState({layer_id});
        cb();
      });
    });
  }

  saveSettings(data: Object, _csrf: string, initLayer: boolean, cb: Function){
    var _this = this;
    request.post('/api/layer/admin/saveSettings')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      name: data.name,
      description: data.description,
      group_id: data.group,
      private: data.private,
      source: data.source,
      license: data.license,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        var layer = _this.state;
        layer.name = data.name;
        layer.description = data.description;
        layer.owned_by_group_id = data.group;
        layer.private = data.private;
        layer.source = data.source;
        layer.license = data.license;
        if(initLayer){
          layer = _this.initLayer(layer);
        }
        _this.setState(layer);
        cb();
      });
    });
  }

  saveDataSettings(data: Object, _csrf: string, cb: Function){
    debug("saveDataSettings");
    var _this = this;
    request.post('/api/layer/admin/saveDataSettings')
    .type('json').accept('json')
    .send({
      layer_id: this.state.layer_id,
      is_empty: data.is_empty,
      empty_data_type: data.empty_data_type,
      is_external: data.is_external,
      external_layer_type: data.external_layer_type,
      external_layer_config: data.external_layer_config,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {       
        let data_type = _this.state.data_type;
        if(data.is_empty){
          data_type = data.empty_data_type;
        }
        _this.setState({
          is_external: data.is_external,
          external_layer_type: data.external_layer_type,
          external_layer_config: data.external_layer_config,
          is_empty: data.is_empty,
          data_type
        });
        cb();
      });
    });
  }

  setStyle(style: Object, labels: Object, legend_html: string, settings: Object, preview_position: Object, cb: Function){

    var mapColor = this.state.mapColor;
    if(settings && settings.color){
      mapColor = settings.color;
    }

    this.setState({
       style,
      labels,
      legend_html,
      preview_position,
      settings,
      mapColor
    });
    this.trigger(this.state);
    if(cb) cb();
  }

  setDataType(data_type: string){
    this.setState({data_type});
  }

  presetsChanged(presets: Object){
    //TODO: make presets part of style object
    this.setState({presets});
  }

  setComplete(_csrf: string, cb: Function){
    var _this = this;
    const complete = true;
    request.post('/api/layer/admin/setComplete')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        _this.setState({complete});
        _this.trigger(_this.state);
        cb();
      });
    });
  }

  saveStyle(data: Object, _csrf: string, cb: Function){
    var _this = this;
    request.post('/api/layer/admin/saveStyle')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      style: data.style,
      labels: data.labels,
      legend_html: data.legend_html,
      preview_position: data.preview_position,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        _this.setState({
          style: data.style,
          legend_html: data.legend_html,
          preview_position: data.preview_position
        });
        cb();
      });
    });
  }

  loadData(_csrf: string, cb: Function){
    debug("loadData");
    if(this.state.layer_id){
       var _this = this;
      request.post('/api/layer/create/savedata/' + this.state.layer_id)
      .type('json').accept('json').timeout(1200000)
      .set('csrf-token', _csrf)
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          _this.trigger(_this.state);
          Actions.dataLoaded();
          cb();
        });
      });
    }
   
  }

  initEmptyLayer(_csrf: string, cb: Function){
    debug("initEmptyLayer");
    if(this.state.layer_id){
      var _this = this;
      request.post('/api/layer/create/empty/' + this.state.layer_id)
      .type('json').accept('json')
      .set('csrf-token', _csrf)
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          _this.trigger(_this.state);
          Actions.dataLoaded();
          cb();
        });
      });
    }
  }

  finishUpload(requestedShapefile: string, _csrf: string, cb: Function){
    var _this = this;
    request.post('/api/layer/finishupload')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      requestedShapefile,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        cb(null, res.body);
      });
    });
  }

  deleteData(data: Object, _csrf: string, cb: Function){
     if(this.state.layer_id){
      request.post('/api/layer/deletedata/' + this.state.layer_id)
      .type('json').accept('json')
      .set('csrf-token', _csrf)
      .end((err, res) => {
        checkClientError(res, err, cb, (cb) => {
          cb();
        });
      });
     }
  }

  deleteLayer(_csrf: string, cb: Function){
    var _this = this;
    request.post('/api/layer/admin/delete')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        cb();
      });
    });
  }
  
  cancelLayer(_csrf: string, cb: Function){
    var _this = this;
    request.post('/api/layer/admin/delete')
    .type('json').accept('json')
    .send({
      layer_id: _this.state.layer_id,
      _csrf
    })
    .end((err, res) => {
      checkClientError(res, err, cb, (cb) => {
        _this.setState({layer: emptyLayer});
        _this.trigger(_this.state);
        cb();
      });
    });
  }

  tileServiceInitialized(){
    this.setState({tileServiceInitialized: true});
  }

  //
  //preset methods


  loadDefaultPresets(){
    //called when setting up a new empty layer
    var presets = [
      {tag: 'name', label: 'Name', type: 'text', isRequired: true, showOnMap: true, id: this.idSequence++},
      {tag: 'description', label: 'Description', type: 'text', isRequired: false,  showOnMap: true, id: this.idSequence++},
      {tag: 'source', label: 'Source', type: 'text', isRequired: true,  showOnMap: true, id: this.idSequence++}
    ];
    this.setState({presets, pendingChanges: true});
  }

  setImportedTags(data: Object){
    debug("setImportedTags");
    var _this = this;
    //clear default presets
    var presets = [];

    //convert tags to presets
    data.forEach((tag: string) => {
      var preset = {};
      if(tag === 'mhid'){
         preset = {tag:'orig_mhid', label: 'orig_mhid', type: 'text', isRequired: false, showOnMap: true, mapTo: tag, id: _this.idSequence++};
      }else{
         preset = {tag, label: tag, type: 'text', isRequired: false, showOnMap: true, mapTo: tag, id: _this.idSequence++};
      }
      presets.push(preset);
    });
    this.setState({presets, pendingChanges: true});
    Actions.presetsChanged(this.state.presets);
  }


  deletePreset(id: number){
    debug("delete preset:"+ id);
    _remove(this.state.presets, {id});
    this.state.pendingChanges = true;
    this.trigger(this.state);
    Actions.presetsChanged(this.state.presets);
  }

  addPreset(){
      debug("adding new preset");
      this.state.presets.push({
      tag: '',
      label: '',
      type: 'text',
      isRequired: false,
      showOnMap: true,
      id: this.idSequence++
    });
    this.state.pendingChanges = true;
    this.trigger(this.state);
    Actions.presetsChanged(this.state.presets);
  }

 updatePreset(id: number, preset: Object){
   debug("update preset:" + id);
   var i = _findIndex(this.state.presets, {id});
   if(i >= 0){
     this.state.presets[i] = preset;
     this.state.pendingChanges = true;
     this.trigger(this.state);
   }else{
     debug("Can't find preset with id: "+ id);
   }
 }

 movePresetUp(id: number){
   var index = _findIndex(this.state.presets, {id});
   if(index === 0) return;
   this.state.presets = this.move(this.state.presets, index, index-1);
   this.trigger(this.state);
   this.presetsChanged(this.state.presets);
 }

 movePresetDown(id: number){
   var index = _findIndex(this.state.presets, {id});
   if(index === this.state.presets.length -1) return;
   this.state.presets = this.move(this.state.presets, index, index+1);
   this.trigger(this.state);
   this.presetsChanged(this.state.presets);
 }

 move(array: Array<Object>, fromIndex: number, toIndex: number) {
    array.splice(toIndex, 0, array.splice(fromIndex, 1)[0] );
    return array;
 }



}
