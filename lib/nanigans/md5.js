'use strict';

/**
 * Module dependencies.
 */

var crypto = require('crypto');

/**
 * MD5 hash a string.
 *
 * @api private
 * @param {string} string The `string` to hash.
 * @return {string} Hashed `string`.
 */

module.exports = function(string){
  return crypto
    .createHash('md5')
    .update(string)
    .digest('hex');
};
