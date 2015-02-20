'use strict';

/**
 * Module dependencies.
 */

var Nanigans = require('..');
var Test = require('segmentio-integration-tester');
var assert = require('assert');

/**
 * Tests.
 */

describe('Nanigans', function(){
  var nanigans, settings, test;

  beforeEach(function(){
    settings = {
      appId: 123,
      events: [
        event('testEvent1', 'user', 'invite'),
        event('testEvent1', 'user', 'register'),
        event('Completed Order', 'purchase', 'main'),
        event('Added to Cart', 'user', 'add_to_cart'),
        event('Viewed Product', 'user', 'product')
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
      .ensure('settings.appId');
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
      var data = test.fixture('track-nonexistent-event');

      test
        .track(data.input)
        .end(function(err, responses){
          assert.equal(responses.length, 0);
          done(err);
        });
    });

    it('should send multiple calls for multiple matched events', function(done){
      var data = test.fixture('track-multiple-matched');

      test
        .track(data.input)
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          assert.equal(responses.length, 2);
          done(err);
        });
    });

    it('should send the correct data for `product` events', function(done){
      var data = test.fixture('track-product');

      test
        .track(data.input)
        .query(data.output)
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          done(err);
        });
    });

    it('should send the correct data for `add_to_cart` events', function(done){
      var data = test.fixture('track-add-to-cart');

      test
        .track(data.input)
        .query(data.output)
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          done(err);
        });
    });

    it('should send the correct data for `purchase` events', function(done){
      var data = test.fixture('track-purchase');

      test
        .track(data.input)
        .query(data.output)
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          done(err);
        });
    });
  });

  describe('#page', function(){
    it('should send the right data for page calls', function(done){
      var data = test.fixture('page-basic');

      test
        .page(data.input)
        .query(data.output)
        .expects(200, done);
    });
  });
});

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
