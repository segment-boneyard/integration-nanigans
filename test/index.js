'use strict';

/**
 * Module dependencies.
 */

var Nanigans = require('..');
var Test = require('segmentio-integration-tester');
var assert = require('assert');
var sinon = require('sinon');

/**
 * Tests.
 */

describe('Nanigans', function(){
  var nanigans, sandbox, settings, test;

  beforeEach(function(){
    sandbox = sinon.sandbox.create();
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
    sandbox.restore();
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
    // FIXME: Not true when mobile
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
      var spy = sandbox.spy(nanigans, 'get');

      test
        .track(data.input)
        .pathname('/event.php')
        .end(function(err){
          assert(!spy.called);
          done(err);
        });
    });

    it('should send multiple calls for multiple matched events', function(done){
      var data = test.fixture('track-multiple-matched');
      var spy = sandbox.spy(nanigans, 'get');

      test
        .track(data.input)
        .pathname('/event.php')
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          assert(spy.calledTwice);
          done(err);
        });
    });

    it('should send the correct data for `product` events', function(done){
      var data = test.fixture('track-product');

      test
        .track(data.input)
        .query(data.output)
        .pathname('/event.php')
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
        .pathname('/event.php')
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
        .pathname('/event.php')
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          done(err);
        });
    });

    it('should send to the mobile endpoint when `settings.isMobile` is `true`', function(done){
      var data = test.fixture('track-mobile');
      settings.isMobile = true;
      settings.facebookAppId = 345;

      test
        .track(data.input)
        .query(data.output)
        .pathname('/mobile.php')
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
        .pathname('/event.php')
        .expects(200, done);
    });

    it('should send to the mobile endpoint when `settings.isMobile` is true', function(done){
      var data = test.fixture('page-mobile');
      settings.facebookAppId = 345;
      settings.isMobile = true;

      test
        .page(data.input)
        .query(data.output)
        .pathname('/mobile.php')
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
