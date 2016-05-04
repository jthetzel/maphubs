var Layer = require('../models/layer');
var Hub = require('../models/hub');
var Story = require('../models/story');
var Map = require('../models/map');
var Group = require('../models/group');
var slug = require('slug');

var local = require('../local');
var urlUtil = require('./url-util');

module.exports = {

  addLayersToSiteMap(sm){
    var baseUrl = urlUtil.getBaseUrl(local.host, local.port);
    return Layer.getAllLayers()
    .then(function(layers){
      layers.forEach(function(layer){
        var lastmodISO = null;
        if(layer.last_updated) lastmodISO = layer.last_updated.toISOString();
        sm.add({
          url: baseUrl + '/layer/info/' + layer.layer_id + '/' + slug(layer.name),
          changefreq: 'weekly',
          lastmodISO
        });
      });
      return sm;
    });
  },

  addStoriesToSiteMap(sm){
    return Story.getAllStories()
    .then(function(stories){
      stories.forEach(function(story){
        var title = story.title.replace('&nbsp;', '');
        var story_url = '';
        if(story.display_name){
          var baseUrl = urlUtil.getBaseUrl(local.host, local.port);
          story_url = baseUrl + '/user/' + story.display_name;
        }else if(story.hub_id){
          var hubUrl = urlUtil.getHubUrl(story.hub_id, local.host, local.port);
          story_url = hubUrl;
        }
        story_url += '/story/' + story.story_id + '/' + slug(title);
        var lastmodISO = null;
        if(story.updated_at) lastmodISO = story.updated_at.toISOString();
        sm.add({
          url: story_url,
          changefreq: 'daily',
          lastmodISO
        });
      });
      return sm;
    });
  },

  addHubsToSiteMap(sm){
    return Hub.getAllHubs()
    .then(function(hubs){
      hubs.forEach(function(hub){
        var hubUrl = urlUtil.getHubUrl(hub.hub_id, local.host, local.port);
        var lastmodISO = null;
        if(hub.updated_at_withTZ) lastmodISO = hub.updated_at_withTZ.toISOString();
        sm.add({
          url: hubUrl,
          changefreq: 'daily',
          lastmodISO
        });
      });
      return sm;
    });
  },

  addMapsToSiteMap(sm){
    return Map.getAllMaps()
    .then(function(maps){
      maps.forEach(function(map){
        var mapUrl =  urlUtil.getBaseUrl(local.host, local.port) + '/user/' + map.username + '/map/' + map.map_id;
        var lastmodISO = null;
        if(map.updated_at) lastmodISO = map.updated_at.toISOString();
        sm.add({
          url: mapUrl,
          changefreq: 'daily',
          lastmodISO
        });
      });
      return sm;
    });
  },

  addGroupsToSiteMap(sm){
    return Group.getAllGroups()
    .then(function(groups){
      groups.forEach(function(group){
        var groupUrl =  urlUtil.getBaseUrl(local.host, local.port) + '/group/' + group.group_id;
        sm.add({
          url: groupUrl,
          changefreq: 'daily'
        });
      });
      return sm;
    });
  }
};