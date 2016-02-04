
'use strict';

/**
 * Module dependencies.
 */

var Integration = require('segmentio-integration');
var Track = require('segmentio-facade').Track;
var extend = require('extend');
var Batch = require('batch');
var sha256 = require('./nanigans/sha256');

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
  .channels(['mobile', 'server'])
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
  var batch = new Batch();
  var self = this;

  events.forEach(function(event){
    batch.push(function(done){
      var data = params(event.type, event.name, track);
      data.app_id = self.settings.appId;
      // Nanigans uses advertising_id to associate anonymous users with server side events
      if (advertisingId) data.advertising_id = advertisingId;
      self.send(data, done);
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

  var payload = {};
  payload.app_id = this.settings.appId;
  payload.name = 'landing';
  payload.type = 'visit';
  // Nanigans uses advertising_id to associate anonymous users with server side events
  if (advertisingId) payload.advertising_id = advertisingId;
  if (options.nan_pid) payload.nan_pid = options.nan_pid;
  this.send(payload, fn);
};

/**
 * Send a request to nanigans
 *
 * @api public
 * @param {Facade} payload
 * @param {Function} done
 */

Nanigans.prototype.send = function(payload, done){
  var isMobile = this.settings.isMobile;

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

function params(type, name, track){
  var ret = { type: type };
  ret.name = renderByProxy(name, track);
  ret.user_id = track.userId();
  if (track.email()) ret.ut1 = sha256(track.email());
  var products = productParams(track);

  if (type === 'purchase'){
    ret.unique = track.orderId();
    extend(ret, products);
  }

  if (type === 'user'){
    if (name === 'product') ret.sku = products.sku[0];
    if (name === 'add_to_cart') extend(ret, products);
  }
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

function productParams(track){
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
