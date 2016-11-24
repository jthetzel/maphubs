/* @flow weak */
var knex = require('../../connection.js');
var queryBbox = require('../../services/query-bbox.js');
var XML = require('../../services/xml.js');
var Promise = require('bluebird');
//var Node = require('../../models/node-model.js');
var User = require('../../models/user');
//var Layer = require('../../models/layer');
var Map = require('../../models/map');
var Layer = require('../../models/layer');
var Story = require('../../models/story');
var Stats = require('../../models/stats');
var BoundingBox = require('../../services/bounding-box.js');
var debug = require('../../services/debug')('routes/map');
var MapUtils = require('../../services/map-utils');
var apiError = require('../../services/error-response').apiError;
var nextError = require('../../services/error-response').nextError;
var apiDataError = require('../../services/error-response').apiDataError;
var notAllowedError = require('../../services/error-response').notAllowedError;

module.exports = function(app) {

  var recordMapView = function(session, map_id, user_id,  next){
    if(!session.mapviews){
      session.mapviews = {};
    }
    if(!session.mapviews[map_id]){
      session.mapviews[map_id] = 1;
      Stats.addMapView(map_id, user_id).catch(nextError(next));
    }else{
      var views = session.mapviews[map_id];

      session.mapviews[map_id] = views + 1;
    }

    session.views = (session.views || 0) + 1;
  };


  app.get('/map/new', function(req, res, next) {

    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
            Layer.getPopularLayers()
            .then(function(popularLayers){
              res.render('map', {title: 'New Map ', props:{popularLayers}, mapboxgl:true, req});
            }).catch(nextError(next));
    } else {
      //get user id
      var user_id = req.session.user.id;

      Promise.all([
        Layer.getPopularLayers(),
        Layer.getUserLayers(user_id, 15)
      ])
        .then(function(results){
          var popularLayers = results[0];
          var myLayers = results[1];
          res.render('map', {title: 'New Map ', props:{popularLayers, myLayers}, mapboxgl:true, req});
        }).catch(nextError(next));
    }

  });

  app.get('/maps', function(req, res, next) {


    Promise.all([
      Map.getFeaturedMaps(),
      Map.getRecentMaps(),
      Map.getPopularMaps()
    ])
      .then(function(results){
        var featuredMaps = results[0];
        var recentMaps = results[1];
        var popularMaps = results[2];
        res.render('maps', {title: req.__('Maps') + ' - ' + MAPHUBS_CONFIG.productName, props: {featuredMaps, recentMaps, popularMaps}, req});
      }).catch(nextError(next));


  });

  app.get('/user/:username/maps', function(req, res, next) {

    var username = req.params.username;
    debug(username);
    if(!username){apiDataError(res);}
    var myMaps = false;

    function completeRequest(){
      User.getUserByName(username)
      .then(function(user){
        if(user){
          return Map.getUserMaps(user.id)
          .then(function(maps){
            res.render('usermaps', {title: 'Maps - ' + username, props:{user, maps, myMaps}, req});
          });
        }else{
          res.redirect('/notfound?path='+req.path);
        }
      }).catch(nextError(next));
    }

    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
          completeRequest();
    } else {
      //get user id
      var user_id = req.session.user.id;

      //get user for logged in user
      User.getUser(user_id)
      .then(function(user){
        //flag if requested user is logged in user
        if(user.display_name === username){
          myMaps = true;
        }
        completeRequest();
      }).catch(nextError(next));
    }
  });

  app.get('/map/view/:map_id/*', function(req, res, next) {
    var map_id = req.params.map_id;
    if(!map_id){
      apiDataError(res);
    }

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }
    recordMapView(req.session, map_id, user_id, next);


    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
        MapUtils.completeUserMapRequest(req, res, next, map_id, false);
    } else {
      //get user id
      Map.allowedToModify(map_id, user_id)
      .then(function(allowed){
        MapUtils.completeUserMapRequest(req, res, next, map_id, allowed);
      });
    }
  });

  app.get('/user/:username/map/:map_id', function(req, res, next) {
    var map_id = req.params.map_id;
    if(!map_id){
      apiDataError(res);
    }

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }
    recordMapView(req.session, map_id, user_id, next);


    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
        MapUtils.completeUserMapRequest(req, res, next, map_id, false);
    } else {
      //get user id
      Map.allowedToModify(map_id, user_id)
      .then(function(allowed){
        MapUtils.completeUserMapRequest(req, res, next, map_id, allowed);
      });
    }
  });

  app.get('/map/edit/:map_id', function(req, res, next) {
    var map_id = req.params.map_id;
    if(!map_id){
      apiDataError(res);
    }

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }

    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
        //need to be logged in
        res.redirect('/unauthorized');
    } else {
      //get user id
      Map.allowedToModify(map_id, user_id)
      .then(function(allowed){
        if(allowed){
          return Promise.all([
          Map.getMap(map_id),
          Map.getMapLayers(map_id),
          Layer.getPopularLayers(),
          Layer.getUserLayers(user_id, 15)
          ])
          .then(function(results){
            var map = results[0];
            var layers = results[1];
            var popularLayers = results[2];
            var myLayers = results[3];
            var title = 'Map';
            if(map.title){
              title = map.title;
            }
            title += ' - ' + MAPHUBS_CONFIG.productName;
              res.render('mapedit',
               {
                 title,
                 props:{map, layers, popularLayers, myLayers},
                 hideFeedback: true,
                 mapboxgl:true,
                 req
               }
             );
          }).catch(nextError(next));
        }else{
          res.redirect('/unauthorized');
        }
      });
    }
  });

  app.get('/map/embed/:map_id', function(req, res, next) {
    var map_id = req.params.map_id;
    if(!map_id){
      apiDataError(res);
    }

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }
    recordMapView(req.session, map_id, user_id, next);

    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
          MapUtils.completeEmbedMapRequest(req, res, next, map_id, false, false);
    } else {
      Map.allowedToModify(map_id, user_id)
      .then(function(allowed){
        MapUtils.completeEmbedMapRequest(req, res, next, map_id, false, allowed);
      });
    }
  });



  app.get('/map/embed/:map_id/static', function(req, res, next) {
    var map_id = req.params.map_id;
    if(!map_id){
      apiDataError(res);
    }

    var user_id = null;
    if(req.session.user){
      user_id = req.session.user.id;
    }
    recordMapView(req.session, map_id, user_id, next);

    if (!req.isAuthenticated || !req.isAuthenticated()
        || !req.session || !req.session.user) {
          MapUtils.completeEmbedMapRequest(req, res, next, map_id, true, false);
    } else {
      Map.allowedToModify(map_id, user_id)
      .then(function(allowed){
        MapUtils.completeEmbedMapRequest(req, res, next, map_id, true, allowed);
      });
    }
  });

    //disable global API only support one layer at a time for now
     /*
    app.get('/xml/map', function (req, res, next) {
        // parse and validate bbox parameter from query
        // See services/BoundingBox.js.
        var paramString = req.query.bbox || '';
        var bbox = new BoundingBox.FromCoordinates(paramString.split(','));
        if (bbox.error) {
            res.send(400, {error: bbox.error});
            return;
        }

        queryBbox(knex, bbox, null)
            .then(function (result) {
                var xmlDoc = XML.write({
                    bbox,
                    nodes: Node.withTags(result.nodes, result.nodetags, 'node_id'),
                    ways: Node.withTags(result.ways, result.waytags, 'way_id'),
                    relations: result.relations
                });
                res.header("Content-Type", "text/xml");
                res.send(xmlDoc.toString());
            }).catch(nextError(next));
    });
    */

    app.get('/xml/map/:layer_id', function (req, res, next) {
        // parse and validate bbox parameter from query
        // See services/BoundingBox.js.
        var layer_id = parseInt(req.params.layer_id || '', 10);

        var paramString = req.query.bbox || '';
        var bbox = new BoundingBox.FromCoordinates(paramString.split(','));
        if (bbox.error) {
            res.status(500).send({error: bbox.error});
            return;
        }

        queryBbox(knex, bbox, layer_id)
            .then(function (result) {
              debug("convert result to XML");
                var xmlDoc = XML.write({
                    bbox,
                    nodes:result.nodes,
                    ways: result.ways,
                    relations: result.relations
                });
                debug("XML ready");
                res.header("Content-Type", "text/xml");
                res.send(xmlDoc.toString());
            }).catch(nextError(next));
    });

    app.post('/api/map/create/usermap', function(req, res) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).send("Unauthorized, user not logged in");
        return;
      }
      var user_id = req.session.user.id;

      var data = req.body;
      if(data && data.basemap && data.position && data.title){
          Map.createUserMap(data.layers, data.style, data.basemap, data.position, data.title, user_id)
          .then(function(result){
            res.status(200).send({success: true, map_id: result[0]});
          }).catch(apiError(res, 500));
      }else{
        apiDataError(res);
      }
    });

    app.post('/api/map/create/storymap', function(req, res) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).send("Unauthorized, user not logged in");
        return;
      }
      var user_id = req.session.user.id;

      var data = req.body;
      if(data && data.layers && data.style && data.basemap && data.position && data.story_id){
        Story.allowedToModify(data.story_id, user_id)
        .then(function(allowed){
          if(allowed){
            Map.createStoryMap(data.layers, data.style, data.basemap, data.position, data.story_id, data.title, user_id)
            .then(function(result){
              res.status(200).send({success: true, map_id: result[0]});
            }).catch(apiError(res, 500));
          }else {
            notAllowedError(res, 'map');
          }
        }).catch(apiError(res, 500));
      }else{
        apiDataError(res);
      }
    });

    app.post('/api/map/copy', function(req, res) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).send("Unauthorized, user not logged in");
        return;
      }
      var user_id = req.session.user.id;

      var data = req.body;
      if(data && data.map_id){
          Map.copyMap(data.map_id, user_id)
          .then(function(map_id){
            res.status(200).send({success: true, map_id});
          }).catch(apiError(res, 500));
      }else{
        apiDataError(res);
      }
    });


    app.post('/api/map/save', function(req, res) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).send("Unauthorized, user not logged in");
        return;
      }
      var user_id = req.session.user.id;

      var data = req.body;
      if(data && data.layers && data.style && data.basemap && data.position && data.map_id){
        Map.allowedToModify(data.map_id, user_id)
        .then(function(allowed){
          if(allowed){
            Map.updateMap(data.map_id, data.layers, data.style, data.basemap, data.position, data.title, user_id)
            .then(function(){
              res.status(200).send({success: true});
            }).catch(apiError(res, 500));
          }else{
            notAllowedError(res, 'map');
          }
        }).catch(apiError(res, 500));
      }else{
        apiDataError(res);
      }
    });

    app.post('/api/map/delete', function(req, res) {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        res.status(401).send("Unauthorized, user not logged in");
        return;
      }
      var user_id = req.session.user.id;

      var data = req.body;
      if(data && data.map_id){
        Map.allowedToModify(data.map_id, user_id)
        .then(function(allowed){
          if(allowed){
            Map.deleteMap(data.map_id)
            .then(function(){
              res.status(200).send({success: true});
            }).catch(apiError(res, 500));
          }else{
            notAllowedError(res, 'map');
          }
        }).catch(apiError(res, 500));
      }else{
        apiDataError(res);
      }
    });

    app.get('/api/map/info/:id', function(req, res) {
      var map_id = parseInt(req.params.id || '', 10);
      Promise.all([
      Map.getMap(map_id),
      Map.getMapLayers(map_id)
      ])
      .then(function(results){
        var map = results[0];
        map.layers = results[1];
        res.status(200).send({success: true, map});
      }).catch(apiError(res, 500));
    });

    app.get('/api/maps/search/suggestions', function(req, res) {
      if(!req.query.q){
        res.status(400).send('Bad Request: Expected query param. Ex. q=abc');
        return;
      }
      var q = req.query.q;
      Map.getSearchSuggestions(q)
        .then(function(result){
          var suggestions = [];
            result.forEach(function(map){
              suggestions.push({key: map.map_id, value:map.title});
            });
            res.send({suggestions});
        }).catch(apiError(res, 500));
    });

    app.get('/api/maps/search', function(req, res) {
      if (!req.query.q) {
        res.status(400).send('Bad Request: Expected query param. Ex. q=abc');
        return;
      }
      Map.getSearchResults(req.query.q)
        .then(function(result){
          res.status(200).send({maps: result});
        }).catch(apiError(res, 500));
    });
};