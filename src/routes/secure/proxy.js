// @flow
var proxy = require('express-http-proxy');
var debug = require('../../services/debug')('proxy');
var local = require('../../local');

module.exports = function(app: any) {


  //if tiles requests make it to the web app, proxy them from here
  //needed for generating screenshots on local MapHubs Pro deployments
  app.use('/tiles', proxy(local.tileServiceInternalUrl, {
  forwardPath(req) {
    var url: Object = require('url').parse(req.url); 
    var path = '/tiles' + url.path;
    debug(path);
    return path;
  }
  }));
  
  app.use('/screenshots', proxy(local.manetUrl, {
  forwardPath(req) {
    var url: Object = require('url').parse(req.url); 
    var path = url.path;
    debug(path);
    return path;
  }
  }));
};
