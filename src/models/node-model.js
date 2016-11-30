// @flow
/**
 * Nodes.js
 *
 * @description :: Represents nodes.
 * Schema: http://chrisnatali.github.io/osm_notes/osm_schema.html#current_nodes
 *
 */

var _map = require('lodash.map');
var _reduce = require('lodash.reduce');
var _includes = require('lodash.includes');
var Promise = require('bluebird');

var knex = require('../connection.js');
var log = require('../services/log.js');
var RATIO = require('../services/ratio.js');
var QuadTile = require('../services/quad-tile.js');
var NodeTag = require('./node-tag.js');
var WayNode = require('./way-node.js');
var Way = require('./way.js');
var debug = require('../services/debug')('model/node');

const BATCH_INSERT_SIZE: number = 1000;

var Node = {

  tableName: 'current_nodes',

  attributes: {
    id: {
      type: 'integer',
      autoIncrement: true,
      unique: true,
      primaryKey: true,
      index: true
    },
    latitude: {
      type: 'integer',
      required: true,
      numeric: true,
      truthy: true
    },
    longitude: {
      type: 'integer',
      required: true,
      numeric: true,
      truthy: true
    },
    changeset_id: {
      type: 'integer',
      numeric: true,
      model: 'changesets'
    },
    visible: {
      type: 'boolean',
      boolean: true
    },
    timestamp: {
      type: 'datetime',
      datetime: true
    },
    tile: {
      type: 'integer',
      index: true,
      numeric: true,
      required: true
    },
    version: {
      type: 'integer',
      numeric: true,
      required: true
    }
  },

  fromEntity(entity: Object, meta: Object, layerID: number) {
    var ratio = RATIO;
    var model = {};
    model.visible = (entity.visible !== 'false' && entity.visible !== false);
    model.version = parseInt(entity.version, 10) || 1;
    model.timestamp = new Date();
    model.layer_id = layerID;
    if (entity.lat !== undefined && entity.lon !== undefined) {
      entity.lat = parseFloat(entity.lat);
      entity.lon = parseFloat(entity.lon);
      model.latitude = entity.lat * ratio | 0;
      model.longitude = entity.lon * ratio | 0;
      model.tile = QuadTile.xy2tile(QuadTile.lon2x(entity.lon), QuadTile.lat2y(entity.lat));
      if(entity.lat === undefined || entity.lon === undefined){
        throw new Error("Error parsing lat/lon: " + JSON.stringify(entity));
      }
    }else{
      throw new Error("Node missing lat/lon: " + JSON.stringify(entity));
    }

    // Parse int on entity.id, so we can see if it's a negative id.
    var id = parseInt(entity.id, 10);
    if (id && id > 0) {
      model.id = id;
    }
    if (entity.changeset) {
      model.changeset_id = parseInt(entity.changeset, 10);
    }
    else if (meta && meta.id) {
      model.changeset_id = parseInt(meta.id);
    }
    return model;
  },

  // Return an entity from a JSON node.
  fromOSM(xml: any) {

    // Transfer all attributes.
    var model = {};
    var attributes = xml.attrs();
    for (var i = 0, ii = attributes.length; i < ii; ++i) {
      var attr = attributes[i];
      model[attr.name()] = attr.value();
    }

    // Transfer tags.
    var children = xml.childNodes();
    var tags = [];
    var keys = [];
    for (i = 0, ii = children.length; i < ii; ++i) {
      var t = children[i];
      if (t.name() === 'tag') {
        var k = t.attr('k').value();
        if(_includes(keys, k)){
          k = k + '_2';
        }
        keys.push(k);
        var tag = {
          k,
          v: t.attr('v').value()
        };
        //debug(JSON.stringify(tag));
        tags.push(tag);
      }
    }
    model.tag = tags;
    return model;
  },

  canBeDeleted(nodeId: number) {
    // No need to call parseInt on node_id, as that's already handled upstream.
    return knex(WayNode.tableName)
    .where('node_id', nodeId)
    .then(function wayNodeResp(wayNodes) {
      // If this node belongs to a way, check to see if
      // any of those ways are visible, aka not deleted yet.
      // Return false if this node is still part of an existing way.
      if (wayNodes) {
        return knex(Way.tableName).whereIn('id',_map(wayNodes, 'way_id'))
        .then(function(ways) {
          var visibleWays = _map(ways, 'visible');
          var visible = _reduce(visibleWays, function(curr, val) {
            return curr && val;
          }, true);
          return visible;
        });
      } else {
        return true;
      }
    })
    .catch(function(err) {
      throw new Error(err);
    });
  },

  // Attach a list of tags to a list of entities
  // by creating a mapping of entities by their id.
  withTags(entities: Array<Object>, tags: Array<Object>, accessor: string) {
    if (!tags.length) {
      return entities;
    }
    var map = {};
    for(var i = 0, ii = entities.length; i < ii; ++i) {
      var entity = entities[i];
      map[entity.id] = entity;
    }
    for(i = 0, ii = tags.length; i < ii; ++i) {
      var tag = tags[i];
      entity = map[tag[accessor]];
      if (entity) {
        if (entity.tags === undefined) {
          entity.tags = [];
        }
        entity.tags.push(tag);
      }
    }
    return entities;
  },
  save(q: any) {
      debug('nodel model saving');
    var actions = [];
    var model = this;
    ['create', 'modify', 'delete'].forEach(function(action) {
      if (q.changeset[action].node) {
        actions.push(action);
      }
    });
    return Promise.map(actions, function(action) {
      return model[action](q);
    })
    .catch(function(err) {
      log.error('Node changeset fails', err);
      throw new Error(err);
    });
  },

  create(q: any) {
    var raw = q.changeset.create.node;
    if(!Array.isArray(raw)){
        raw = [raw];
    }
    // Map each node creation to a model with proper attributes.
    var models = raw.map(function(entity) { return Node.fromEntity(entity, q.meta, q.layerID); });

    function remap(ids) {
      log.info('Remapping', ids.length, 'node IDs');
      var tags = [];
      raw.forEach(function(entity, i) {
        // create a map of the old id to new id for ways, relations to reference.
        q.map.node[entity.id] = ids[i];
        // update the new node id on the changeset
        // TODO is this step necessary?
        entity.id = ids[i];
        // Check for Node tags. If they exist, they will be in the form of an array.
        if (entity.tag){
          if(!Array.isArray(entity.tag)){
              entity.tag = [entity.tag];
          }
          if(entity.tag.length) {
          tags.push(entity.tag.map(function(t) {
            return {
              k: t.k,
              v: t.v,
              node_id: entity.id
            };
          }));
        }
      }
      });
      return tags;
    }

    function saveTags (tags: any) {
      // Only save tags if there are any.
      if(!Array.isArray(tags)){
          tags = [tags];
      }
      if (tags.length) {
        tags = [].concat.apply([], tags);

        return knex.batchInsert(NodeTag.tableName, tags, BATCH_INSERT_SIZE)
        .transacting(q.transaction)
        .catch(function(err) {
          log.error('Creating node tags in create', err);
          throw new Error(err);
        });
      }
      return [];
    }
    log.info("inserting nodes");
    return knex.batchInsert(Node.tableName, models, BATCH_INSERT_SIZE).returning('id')
    .transacting(q.transaction)
    .then(remap)
    .then(saveTags)
    .catch(function(err) {
      log.error('Inserting new nodes in create', err);
      throw new Error(err);
    });
  },

  modify(q: any) {
    var raw = q.changeset.modify.node;
    if(!Array.isArray(raw)){
        raw = [raw];
    }

    function deleteTags () {
      var ids = raw.map(function(entity) { return parseInt(entity.id, 10); });
      return q.transaction(NodeTag.tableName).whereIn('node_id', ids).del();
    }

    return Promise.map(raw, function(entity) {
      return q.transaction(Node.tableName).where({id: entity.id, layer_id: q.layerID})
        .update(Node.fromEntity(entity, q.meta, q.layerID));
    })
    .then(deleteTags)
    .then(function () {
      var tags = [];
      raw.forEach(function(entity) {
        if (entity.tag){
            if(!Array.isArray(entity.tag)){
                entity.tag = [entity.tag];
            }
            if(entity.tag.length) {
                tags.push(entity.tag.map(function(t) {
                    return {
                    k: t.k,
                    v: t.v,
                    node_id: entity.id
                    };
                }));
            }
        }
      });
      if (tags.length) {
        tags = [].concat.apply([], tags);
        return knex.batchInsert(NodeTag.tableName, tags, BATCH_INSERT_SIZE)
        .transacting(q.transaction);
      }
      return [];
    })
    .catch(function(err) {
      log.error('Error modifying nodes', err);
      throw new Error(err);
    });
  },

  'delete'(q: any) {
    var raw = q.changeset['delete'].node;
    if(!Array.isArray(raw)){
        raw = [raw];
    }
    var ids = _map(raw, 'id');

    return q.transaction(Node.tableName)
    .where({layer_id: q.layerID})
    .whereIn('id', ids)
    .update({visible: false, changeset_id: q.meta.id}).returning('id')

    .then(function(invisibleNodes) {
      return q.transaction(NodeTag.tableName).whereIn('node_id', invisibleNodes)
      .del().returning('node_id');
    })
    .catch(function(err) {
      log.error('Error deleting nodes', err);
      throw new Error(err);
    });
  }
};

module.exports = Node;
