var Layer = require('../../models/layer');
var apiError = require('../../services/error-response').apiError;
var ogr2ogr = require('ogr2ogr');
var tokml = require('tokml');
var debug = require('../../services/debug')('exports');
var privateLayerCheck = require('../../services/private-layer-check').middleware;
var knex = require('../../connection.js');
var Promise = require('bluebird');

module.exports = function(app) {

  app.get('/api/layer/:layer_id/export/json/*', privateLayerCheck, function(req, res) {
      var layer_id = parseInt(req.params.layer_id || '', 10);
      Layer.getGeoJSON(layer_id).then(function(geoJSON){
        res.status(200).send(geoJSON);
      }).catch(apiError(res, 200));
  });


  app.get('/api/layer/:layer_id/export/svg/*', privateLayerCheck, function(req, res) {
      var layer_id = parseInt(req.params.layer_id || '', 10);
      Layer.getLayerByID(layer_id).then(function(layer){
        return Promise.all([
          knex.raw(`select ST_AsSVG(ST_Transform(wkb_geometry, 900913)) as svg from layers.data_${layer.layer_id};`),
          knex.raw(`select ST_XMin(bbox)::float as xmin, 
            ST_YMin(bbox)::float as ymin, 
            ST_XMax(bbox)::float as xmax, ST_YMax(bbox)::float as ymax 
            from (select ST_Extent(ST_Transform(wkb_geometry, 900913)) as bbox from layers.data_${layer.layer_id}) a`)
        ]).then(function(results){
          var featureSVGs = results[0];
          var bounds = results[1].rows[0];
          var paths = '';
          var color = '#FF0000';
          if(layer.settings &&  layer.settings.color){
            color = layer.settings.color;
          } 
          
          if(layer.data_type === 'point'){
            featureSVGs.rows.forEach(function(row){
               paths += `<path d="${row.svg}"></path>`;
            });

          }else if(layer.data_type === 'line'){
            featureSVGs.rows.forEach(function(row){
               paths += `<path d="${row.svg}"></path>`;
            });
          }else if(layer.data_type === 'polygon'){
            featureSVGs.rows.forEach(function(row){
               paths += `<path fill="${color}" stroke="black" stroke-width="3000" d="${row.svg}"></path>`;
            });

           
          }

          var width = bounds.xmax-bounds.xmin;
          var height = bounds.ymax-bounds.ymin;

          var svg = `
          <svg xmlns="http://www.w3.org/2000/svg"
          id="maphubs-layer-${layer.layer_id}" viewBox="${bounds.xmin} ${bounds.ymin} ${width} ${height*2}" preserveAspectRatio="xMidYMid meet">
          ${paths}
          </svg>
          `;

          res.header("Content-Type", "image/svg+xml");
          res.status(200).send(svg);
        });
      }).catch(apiError(res, 200));
  });

  app.get('/api/layer/:layer_id/export/csv/*', privateLayerCheck, function(req, res) {
    var layer_id = parseInt(req.params.layer_id || '', 10);

    Layer.getGeoJSON(layer_id).then(function(geoJSON){
      var resultStr = JSON.stringify(geoJSON);
      var hash = require('crypto').createHash('md5').update(resultStr).digest("hex");
      var match = req.get('If-None-Match');
      if(hash == match){
        res.status(304).send();
      }else{
        res.writeHead(200, {
          'Content-Type': 'text/csv',
          'ETag': hash
        });

        ogr2ogr(geoJSON)
        .format('CSV')
        .skipfailures()
        .options(['-t_srs', 'EPSG:4326'])
        .timeout(60000)
        .stream()
        .pipe(res);
      }
    }).catch(apiError(res, 200));
  });

  app.get('/api/layer/:layer_id/export/kml/*', privateLayerCheck, function(req, res) {
    var layer_id = parseInt(req.params.layer_id || '', 10);
    Layer.getGeoJSON(layer_id).then(function(geoJSON){
      return Layer.getLayerByID(layer_id)
      .then(function(layer){
        var geoJSONStr = JSON.stringify(geoJSON);
        var hash = require('crypto').createHash('md5').update(geoJSONStr).digest("hex");
        var match = req.get('If-None-Match');
        if(hash == match){
          res.status(304).send();
        }else{
          res.header("Content-Type", "application/vnd.google-earth.kml+xml");
          res.header("ETag", hash);

          geoJSON.features.map(function(feature){
            if(feature.properties){
              if(layer.data_type === 'polygon'){
                feature.properties['stroke'] = '#212121';
                feature.properties['stroke-width'] = 2;
                feature.properties['fill'] = '#FF0000';
                feature.properties['fill-opacity'] = 0.5;
              }else if(layer.data_type === 'line'){
                feature.properties['stroke'] = '#FF0000';
                feature.properties['stroke-width'] = 2;
              }else if(layer.data_type === 'point'){
                feature.properties['marker-color'] = '#FF0000';
                feature.properties['marker-size'] = 'medium';
              }
            }
          });

          var kml = tokml(geoJSON, {
              name: 'name',
              description: 'description',
              documentName: layer.name,
              documentDescription: layer.description,
              simplestyle: true
          });

          debug("KML Generated");

          res.status(200).send(kml);
        }
      });
    }).catch(apiError(res, 200));
  });

  app.get('/api/layer/:layer_id/export/gpx/*', privateLayerCheck, function(req, res) {
    var layer_id = parseInt(req.params.layer_id || '', 10);
    Layer.getGeoJSON(layer_id).then(function(geoJSON){
      var resultStr = JSON.stringify(geoJSON);
      var hash = require('crypto').createHash('md5').update(resultStr).digest("hex");
      var match = req.get('If-None-Match');
      if(hash == match){
        res.status(304).send();
      }else{
        res.writeHead(200, {
          'Content-Type': 'application/gpx+xml',
          'ETag': hash
        });
        ogr2ogr(geoJSON)
        .format('GPX')
        .skipfailures()
        .options(['-t_srs', 'EPSG:4326','-dsco', 'GPX_USE_EXTENSIONS=YES'])
        .timeout(60000)
        .stream()
        .pipe(res);
      }
    }).catch(apiError(res, 200));
  });

  app.get('/api/layer/:layer_id/export/shp/*', privateLayerCheck, function(req, res) {
    var layer_id = parseInt(req.params.layer_id || '', 10);

    Layer.getGeoJSON(layer_id).then(function(geoJSON){
      var resultStr = JSON.stringify(geoJSON);
      var hash = require('crypto').createHash('md5').update(resultStr).digest("hex");
      var match = req.get('If-None-Match');
      if(hash == match){
        res.status(304).send();
      }else{
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'ETag': hash
        });

      ogr2ogr(geoJSON)
      .format('ESRI Shapefile')
      .skipfailures()
      .options(['-t_srs', 'EPSG:4326'])
      .timeout(60000)
      .stream()
      .pipe(res);
    }
    }).catch(apiError(res, 200));
  });
};
