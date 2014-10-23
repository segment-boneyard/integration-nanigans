
var Test = require('segmentio-integration-tester');
var assert = require('assert');
var crypto = require('crypto');
var Nanigans = require('..');

describe('Nanigans', function(){
  var nanigans;
  var settings;

  beforeEach(function(){
    settings = {
      appId: 123,
      events: [
        event('testEvent1', 'user', 'invite'),
        event('testEvent1', 'user', 'register'),
        event('completed order', 'purchase', 'main'),
        event('add to cart', 'user', 'add_to_cart'),
        event('viewed product', 'user', 'product')
      ]
    };
  });

  beforeEach(function(){
    nanigans = new Nanigans(settings);
    test = Test(nanigans, __dirname);
  });

  it('should have correct settings', function(){
    test
      .name('Nanigans')
      .channels(['server'])
      .endpoint('https://api.nanigans.com')
      .ensure('settings.events')
      .ensure('settings.appId')
      .retries(2);
  });

  describe('#validate', function(){
    it('should be invalid without .appId', function(){
      delete settings.appId;
      test.invalid({}, settings);
    });

    it('should be invalid without events', function(){
      delete settings.events;
      test.invalid({}, settings);
    });

    it('should validate successfully with complete settings', function(){
      test.valid({}, settings);
    });
  });

  describe('#track', function(){
    it('should not make any calls for no matched events', function(done){
      test
        .track({ event: 'uknown', userId: 'userId' })
        .end(function(err, responses){
          assert.equal(responses.length, 0);
          done(err);
        });
    });

    it('should send multiple calls for multiple matched events', function(done){
      test
        .track({ event: 'testEvent1', userId: 'userId' })
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          assert.equal(responses.length, 2);
          done(err);
        });
    });

    it('should send the correct data for \'product\' events', function(done){
      var products = [
        { sku: '1', price: 1, quantity: 1 },
        { sku: '2', price: 2, quantity: 2 }
      ];

      var track = {};
      track.properties = { products: products, orderId: 'orderId' };
      track.context = { traits: { email: 'email' }};
      track.event = 'viewed product';
      track.userId = 'userId';

      test
        .track(track)
        .query({ app_id: settings.appId })
        .query({ user_id: 'userId' })
        .query({ ut1: md5('email') })
        .query({ name: 'product' })
        .query({ sku: '1' })
        .query({ type: 'user' })
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          done(err);
        });
    });

    it('should send the correct data for \'add_to_cart\' events', function(done){
      var products = [
        { sku: '1', price: 1, quantity: 1 },
        { sku: '2', price: 2, quantity: 2 }
      ];

      var track = {};
      track.properties = { products: products, orderId: 'orderId' };
      track.context = { traits: { email: 'email' }};
      track.event = 'add to cart';
      track.userId = 'userId';

      test
        .track(track)
        .query({ qty: ['1', '2'], sku: ['1', '2'], value: ['1', '2'] })
        .query({ app_id: settings.appId })
        .query({ name: 'add_to_cart' })
        .query({ user_id: 'userId' })
        .query({ ut1: md5('email') })
        .query({ type: 'user' })
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); })
          done(err);
        });
    });

    it('should send the correct data for purchase events', function(done){
      var products = [
        { sku: '1', price: 1, quantity: 1 },
        { sku: '2', price: 2, quantity: 2 }
      ];

      var track = {};
      track.properties = { products: products, orderId: 'orderId' };
      track.context = { traits: { email: 'email' }};
      track.event = 'completed order';
      track.userId = 'userId';

      test
        .track(track)
        .query({ qty: ['1', '2'], sku: ['1', '2'], value: ['1', '2'] })
        .query({ app_id: settings.appId })
        .query({ user_id: 'userId' })
        .query({ ut1: md5('email') })
        .query({ unique: 'orderId' })
        .query({ type: 'purchase' })
        .query({ name: 'main' })
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); })
          done(err);
        });
    });
  });

  describe('#page', function(){
    it('should send the right data for page calls', function(done){
      test
        .page({})
        .query({ app_id: settings.appId })
        .query({ name: 'landing' })
        .query({ type: 'visit' })
        .expects(200, done)
    });
  });
});

/**
 * md5 hash the string
 *
 * @param {String} string
 * @return {String}
 */

function md5(string){
  return crypto
    .createHash('md5')
    .update(string)
    .digest('hex');
}

/**
 * Helper method for creating an event in the settings object
 *
 * @param {String} key
 * @param {String} type
 * @param {String} name
 */

function event(key, type, name){
  return {
    key: key,
    value: {
      type: type,
      name: name
    }
  };
}
