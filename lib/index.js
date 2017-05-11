
'use strict';

/**
 * Module dependencies.
 */

var Integration = require('segmentio-integration');
var Track = require('segmentio-facade').Track;
var extend = require('extend');
var Batch = require('batch');
var sha256 = require('./nanigans/sha256');
var unixTime = require('unix-time');

/**
 * Expose `nanigans`
 *
 * https://s3.amazonaws.com/segmentio/docs/integrations/nanigans/docs.html
 */

var Nanigans = module.exports = Integration('Nanigans')
  .endpoint('https://api.nanigans.com')
  .ensure('settings.events')
  .ensure('settings.appId')
  .ensure(function(msg, settings){
    if (settings.isMobile && !settings.fbAppId) {
      return this.invalid('Mobile projects must specify a `fbAppId`.');
    }
  })
  .channels(['client', 'mobile', 'server'])
  .retries(2);

/**
 * Track.
 *
 * https://s3.amazonaws.com/segmentio/docs/integrations/nanigans/docs.html
 *
 * @api public
 * @param {Facade} track
 * @param {Function} fn
 */

Nanigans.prototype.track = function(track, fn){
  var events = this.map(this.settings.events, track.event());
  var advertisingId = track.proxy('context.device.advertisingId');
  var type = track.proxy('context.device.type')
  var batch = new Batch();
  var self = this;

  events.forEach(function(event){
    batch.push(function(done){
      var data = params(event, track, self.settings);
      data.app_id = self.settings.appId;
      data.e_ts = unixTime(track.timestamp());
      // Nanigans uses advertising_id to associate anonymous users with server side events
      if (advertisingId) data.advertising_id = advertisingId;
      self.send(data, type, done);
    });
  });

  batch.end(fn);
};

/**
 * Page.
 *
 * https://s3.amazonaws.com/segmentio/docs/integrations/nanigans/docs.html
 *
 * @api public
 * @param {Facade} page
 * @param {Function} fn
 */

Nanigans.prototype.page = function(page, fn){
  var options = page.options(this.name);
  var advertisingId = page.proxy('context.device.advertisingId');
  var type = page.proxy('context.device.type')

  var payload = {};
  payload.app_id = this.settings.appId;
  payload.name = 'landing';
  payload.type = 'visit';
  payload.e_ts = unixTime(page.timestamp());
  // Nanigans uses advertising_id to associate anonymous users with server side events
  if (advertisingId) payload.advertising_id = advertisingId;
  if (options.nan_pid) payload.nan_pid = options.nan_pid;
  this.send(payload, type, fn);
};

/**
 * Send a request to nanigans
 *
 * @api public
 * @param {Facade} payload
 * @param {Function} done
 */

Nanigans.prototype.send = function(payload, type, done){
  var isMobile = this.settings.isMobile;

  // If data was sent by a mobile library, it should use the mobile endpoint
  if (type == 'iOS' || type == 'android') isMobile = true;

  if (isMobile) {
    payload.fb_app_id = this.settings.fbAppId;
  }

  return this
    .get(isMobile ? '/mobile.php' : '/event.php')
    .query(payload)
    .end(this.handle(done));
};

/**
 * Create the query params for the tracking event.
 *
 * @api private
 * @param {string} type
 * @param {string} name
 * @param {Track} track
 * @return {Object}
 */

function params(event, track, settings) {
  var ret = {
    type: event.type,
    name: renderByProxy(event.name, track),
  };

  if (track.userId()) ret.user_id = track.userId();
  if (track.email()) ret.ut1 = sha256(track.email());
  var products = productParams(track, settings);

  if (event.type === 'purchase') {
    ret.unique = track.orderId();
    extend(ret, products);
  }

  if (event.type === 'user'){
    if (event.name === 'product') ret.sku = products.sku[0];
    if (event.name === 'add_to_cart') extend(ret, products);
  }

  var custom = event.customParameters || [];
  custom.forEach(function(obj) {
    var value;
    if (obj.key && obj.value) value = track.proxy('properties.' + obj.key);
    if (value) ret[obj.value] = value;
  });

  return ret;
}

/**
 * Return the product-related params for a track call. Includes sku,
 * qty and value arrays.
 *
 * @api private
 * @param {Track} track
 * @return {Object}
 */

function productParams(track, settings){
  var products = track.products();
  var ret = {};
  ret.qty = Array(products.length);
  ret.sku = Array(products.length);
  ret.value = Array(products.length);

  products.forEach(function(product, i){
    var item = new Track({ properties: product });
    ret.qty[i] = item.quantity();
    ret.sku[i] = item.sku();
    ret.value[i] = item.price();
    if (settings.revenueToCents) {
      ret.value[i] = ret.value[i] * 100;
    }
  });

  return ret;
}

/**
 * Render Nanigans event name from template.
 *
 * @param {Object} user
 * @return {String}
 */

function renderByProxy(template, facade) {
  return template.replace(/\{\{\ *(\w+?[\.\w+]*?)\ *\}\}/g, function(_, $1) {
    return facade.proxy($1) || '';
  });
}
