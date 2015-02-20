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
  .ensure(function(_, settings){
    if (settings.isMobile) {
      if (!settings.facebookAppId) {
        return this.invalid('settings.facebookAppId is required when `settings.isMobile` is `true`.');
      }
    } else {
      if (!settings.appId) {
        return this.invalid('settings.appId is required.');
      }
    }
  })
  .channels(['server', 'mobile'])
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
  var batch = new Batch();
  var self = this;

  events.forEach(function(event){
    batch.push(function(done){
      var data = params(event.type, event.name, track);
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
  var payload = {};
  payload.name = 'landing';
  payload.type = 'visit';
  if (options.nan_pid) payload.nan_pid = options.nan_pid;
  this.send(payload, fn);
};

/**
 * Send a request to Nanigans.
 *
 * @api public
 * @param {Object} params
 * @param {Function} fn
 */

Nanigans.prototype.send = function(params, fn){
  var isMobile = this.settings.isMobile;
  var url = isMobile ? '/mobile.php' : '/event.php';

  var ident = {};
  if (isMobile) {
    ident.fb_app_id = this.settings.facebookAppId;
  } else {
    ident.app_id = this.settings.appId;
  }

  return this
    .get(url)
    .query(params)
    .query(ident)
    .end(this.handle(fn));
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
  ret.name = name;
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
