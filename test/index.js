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
      appId: '123',
      mobile: false,
      fbAppId: '345',
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
      .channels(['mobile', 'server'])
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

    it('should be invalid when .isMobile is true but .fbAppId is not set', function(){
      settings.isMobile = true;
      settings.fbAppId = '';
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
        .end(function(err, responses){
          responses.forEach(function(res){ assert(res.ok); });
          assert(!spy.called, 'Expected spy to have not been called');
          done(err);
        });
    });

    it('should send multiple calls for multiple matched events', function(done){
      var data = test.fixture('track-multiple-matched');
      var spy = sandbox.spy(nanigans, 'get');

      test
        .track(data.input)
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

    it('should send to the mobile endpoint when `.isMobile` is `true`', function(done){
      var data = test.fixture('track-mobile');
      var spy = sandbox.spy(nanigans, 'get');
      settings.isMobile = true;

      test
        .track(data.input)
        .query(data.output)
        .end(function(err, responses){
          responses.forEach(function(res) { assert(res.ok); });
          assert(spy.calledWithExactly('/mobile.php'));
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

    it('should send to the mobile endpoint when `.isMobile` is `true`', function(done){
      var data = test.fixture('page-mobile');
      var spy = sandbox.spy(nanigans, 'get');
      settings.isMobile = true;

      test
        .page(data.input)
        .query(data.output)
        .end(function(err, responses){
          responses.forEach(function(res) { assert(res.ok); });
          assert(spy.calledWithExactly('/mobile.php'));
          done(err);
        });
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
