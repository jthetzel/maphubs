// @flow
var Feature = require('../../models/feature');
var Layer = require('../../models/layer');
var PhotoAttachment = require('../../models/photo-attachment');
var knex = require('../../connection.js');
var Tag = require('../../models/tag');
var urlUtil = require('../../services/url-util');
var imageUtils = require('../../services/image-utils');
var Promise = require('bluebird');
var layerViews = require('../../services/layer-views');
var debug = require('../../services/debug')('routes/features');
var log = require('../../services/log');
//var log = require('../../services/log.js');
//var debug = require('../../services/debug')('routes/features');
var apiError = require('../../services/error-response').apiError;
var nextError = require('../../services/error-response').nextError;
var apiDataError = require('../../services/error-response').apiDataError;
var notAllowedError = require('../../services/error-response').notAllowedError;
var csrfProtection = require('csurf')({cookie: false});

module.exports = function(app: any) {

  //TODO: [Privacy]
  app.get('/feature/:layer_id/:osm_id/*', csrfProtection, function(req, res, next) {

    var osm_id = req.params.osm_id;
    var layer_id = parseInt(req.params.layer_id || '', 10);

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }

    if(osm_id && layer_id){
        Layer.getLayerByID(layer_id)
        .then(function(layer){

      return Promise.all([
        Feature.getFeatureByID(osm_id, layer),
        PhotoAttachment.getPhotoIdsForFeature(layer_id, osm_id),
      ])
      .then(function(results){
        var feature = results[0].feature;
        //only supporting one photo per feature for now...
        var photos = results[1];
        var photo = null;
        if(photos && Array.isArray(photos)){
          photo = photos[0];
        }
        var notes = null;
        if(results[0].notes && results[0].notes.notes){
          notes = results[0].notes.notes;
        }
        var featureName = "Feature";
        if(feature.geojson.features.length > 0 && feature.geojson.features[0].properties){
          var geoJSONProps = feature.geojson.features[0].properties;
          if(geoJSONProps.name) {
            featureName = geoJSONProps.name;
          }
          geoJSONProps.layer_id = layer_id;
          geoJSONProps.osm_id = osm_id;
        }
        feature.layer_id = layer_id;
        
        feature.osm_id = osm_id;
       

        if (!req.isAuthenticated || !req.isAuthenticated()) {
          res.render('featureinfo',
          {
            title: featureName + ' - ' + MAPHUBS_CONFIG.productName,
            fontawesome: true,
            mapboxgl:true,
            props: {feature, notes, photo, layer, canEdit: false},
             req
           });
        }else{
          Layer.allowedToModify(layer_id, user_id)
          .then(function(allowed){
            if(allowed){
              res.render('featureinfo',
              {
                title: featureName + ' - ' + MAPHUBS_CONFIG.productName,
                fontawesome: true,
                mapboxgl:true,
                props: {feature, notes, photo, layer, canEdit: true}, req
              });
            }
            else{
              res.render('featureinfo',
              {
                title: featureName + ' - ' + MAPHUBS_CONFIG.productName,
                fontawesome: true,
                mapboxgl:true,
                props: {feature, notes, photo, layer, canEdit: false},
                 req
               });
            }
        });
      }
      });
      }).catch(nextError(next));
    }else{
      next(new Error('Missing Required Data'));
    }
  });

  //TODO: [Privacy]
  app.get('/api/feature/gpx/:layer_id/:osm_id/*', function(req, res, next) {

    var osm_id = req.params.osm_id;
    var layer_id = parseInt(req.params.layer_id || '', 10);

    if(osm_id && layer_id){
        Layer.getLayerByID(layer_id)
        .then(function(layer){
          return Feature.getFeatureByID(osm_id, layer)
          .then(function(result){
            var feature = result.feature;        
            var geoJSON = feature.geojson;
            geoJSON.features[0].geometry.type = "LineString";
            var coordinates = geoJSON.features[0].geometry.coordinates[0][0];
            log.info(coordinates)
            var resultStr = JSON.stringify(geoJSON);
            log.info(resultStr);
            var hash = require('crypto').createHash('md5').update(resultStr).digest("hex");
            var match = req.get('If-None-Match');
            if(hash == match){
              res.status(304).send();
            }else{
              res.writeHead(200, {
                'Content-Type': 'application/gpx+xml',
                'ETag': hash
              });

              var gpx = `
              <gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" creator="MapHubs">
                <metadata>
                  <link href="https://maphubs.com">
                    <text>MapHubs</text>
                  </link>
                </metadata>
                <trk>
                  <name>Feature</name>
                  <trkseg>
                  `;
                  coordinates.forEach(function(coord){
                     gpx += ` <trkpt lon="${coord[0]}" lat="${coord[1]}"></trkpt>`;
                  });
                    
                 gpx += `
                  </trkseg>
                </trk>
                </gpx>`;

              res.end(gpx);         
            }
          });
          }).catch(nextError(next));
    }else{
      next(new Error('Missing Required Data'));
    }
  });

  //TODO: [Privacy]
  app.get('/feature/photo/:photo_id.jpg', function(req, res) {
    var photo_id = req.params.photo_id;
    PhotoAttachment.getPhotoAttachment(photo_id)
    .then(function(result){
      imageUtils.processImage(result.data, req, res);
    }).catch(apiError(res, 404));

  });

  app.post('/api/feature/notes/save', csrfProtection, function(req, res) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).send("Unauthorized, user not logged in");
      return;
    }
    var user_id = req.session.user.id;
    var data = req.body;
    if (data && data.layer_id && data.osm_id && data.notes) {
      Layer.allowedToModify(data.layer_id, user_id)
      .then(function(allowed){
        if(allowed){
          Feature.saveFeatureNote(data.osm_id, data.layer_id, user_id, data.notes)
            .then(function() {
              res.send({success: true});
            }).catch(apiError(res, 500));
        }else {
          notAllowedError(res, 'layer');
        }
      }).catch(apiError(res, 500));
    } else {
      apiDataError(res);
    }
  });

  app.post('/api/feature/photo/add', csrfProtection, function(req, res) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).send("Unauthorized, user not logged in");
      return;
    }
    var user_id = req.session.user.id;
    var data = req.body;
    if (data && data.layer_id && data.osm_id && data.image && data.info) {
      var raw_osm_id = data.osm_id.substring(1);
      Layer.allowedToModify(data.layer_id, user_id)
      .then(function(allowed){
        if(allowed){
          return knex.transaction(function(trx) {
            //set will replace existing photo
          return PhotoAttachment.setPhotoAttachment(data.layer_id, data.osm_id, data.image, data.info, user_id, trx)
            .then(function(photo_id) {
              return Layer.getLayerByID(data.layer_id, trx)
              .then(function(layer){
                var baseUrl = urlUtil.getBaseUrl();
                var photo_url = baseUrl + '/feature/photo/' + photo_id + '.jpg';
                //add a tag to the feature
                var command = new Promise(function(cb){cb();});
                if(data.osm_id.startsWith('n')){
                  debug('set node tag');
                  command = Tag.setNodeTag(raw_osm_id, 'photo_url', photo_url, trx);
                }else if(data.osm_id.startsWith('w')){
                  debug('set way tag');
                  command = Tag.setWayTag(raw_osm_id, 'photo_url', photo_url, trx);
                }else if(data.osm_id.startsWith('p')){
                  debug('set polygon tag');
                  command = Tag.setPolygonTag(data.layer_id, raw_osm_id, 'photo_url', photo_url, trx);
                }else if(data.osm_id.startsWith('m')){
                  debug('set multipolygon tag');
                  command = Tag.setMultiPolygonTag(data.layer_id, raw_osm_id, 'photo_url', photo_url, trx);
                }else{
                  throw new Error('old osm_id found: ' + data.osm_id);
                }

                return command.then(function(){
                  debug('addPhotoUrlPreset');
                  return PhotoAttachment.addPhotoUrlPreset(layer, user_id, trx)
                  .then(function(presets){
                    debug('replaceViews');
                      return layerViews.replaceViews(data.layer_id, presets, trx)
                    .then(function(){
                      debug('Layer.setUpdated');
                      return Layer.setUpdated(data.layer_id, user_id, trx)
                      .then(function(){
                        return res.send({success: true, photo_id, photo_url});
                      });
                    });
                  });
                });
              });
            });
          }).catch(apiError(res, 500));
        }else {
          notAllowedError(res, 'layer');
        }
      }).catch(apiError(res, 500));
    } else {
      apiDataError(res);
    }
  });

  app.post('/api/feature/photo/delete', csrfProtection, function(req, res) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      res.status(401).send("Unauthorized, user not logged in");
      return;
    }
    var user_id = req.session.user.id;
    var data = req.body;
    if (data && data.layer_id && data.osm_id && data.photo_id) {
      var raw_osm_id = data.osm_id.substring(1); //without the type prefix
      Layer.allowedToModify(data.layer_id, user_id)
      .then(function(allowed){
        if(allowed){
          return knex.transaction(function(trx) {
            //set will replace existing photo
          return PhotoAttachment.deletePhotoAttachment(data.layer_id, data.osm_id, data.photo_id, trx)
            .then(function() {
              return Layer.getLayerByID(data.layer_id, trx)
              .then(function(layer){
                //remove tag from feature
                var command;
                if(data.osm_id.startsWith('n')){
                  command = Tag.removeNodeTag(raw_osm_id, 'photo_url', trx);
                }else if(data.osm_id.startsWith('w')){
                  command = Tag.removeWayTag(raw_osm_id, 'photo_url', trx);
                }else if(data.osm_id.startsWith('p')){
                  command = Tag.removePolygonTag(data.layer_id, raw_osm_id, 'photo_url', trx);
                }else if(data.osm_id.startsWith('m')){
                  command = Tag.removeMultiPolygonTag(data.layer_id, raw_osm_id, 'photo_url', trx);
                }else{
                  throw new Error('old osm_id found: ' + data.osm_id);
                }

                return command.then(function(){
                  return layerViews.replaceViews(data.layer_id, layer.presets, trx)
                  .then(function(){
                    return Layer.setUpdated(data.layer_id, user_id, trx)
                    .then(function(){
                      res.send({success: true});
                    });
                  });
                });
              });
            });
          }).catch(apiError(res, 500));
        }else {
          notAllowedError(res, 'layer');
        }
      }).catch(apiError(res, 500));
    } else {
      apiDataError(res);
    }
  });
};
