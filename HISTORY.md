1.5.0 / 2017-05-12
==================

  * Ensure that sku, value, and qty arrays are sent with indicies (?sku[0]=2&sku[1]=3 instead of ?sku=2&sku=3)

1.4.3 / 2017-04-17
==================

  * Bump int-tester version to 2.x (#27)

1.4.0 / 2017-01-31
==================

  * Standardize integration (linting, Docker configuration, circle.yml, upgrade
segmentio-integration version, upgrade integration-worker version, etc.)


1.3.6 / 2016-06-30
==================

  * Merge pull request #13 from segment-integrations/add-timestamp
  * Update Badge
  * Readd facade and add timestamp to customer parameters test.
  * Fix merge conflict.
  * No longer passing user_id if one is not present.
  * Added timestamp for replay purposes.

1.3.5 / 2016-06-28
==================

  * add support for revenue to cents

1.3.4 / 2016-06-13
==================

  * add support for custom parameters

1.3.3 / 2016-05-11
==================

  * Revert "add support for custom parameters"

1.3.2 / 2016-05-05
==================

  * add support for custom parameters

1.3.1 / 2016-02-10
==================

  * enforce all mobile data to hit mobile endpoint
  * adding idfa to track and page

1.3.0 / 2015-09-08
==================

  * add support for dynamic / interpolated event names
  * Revert @wcjohnson11's "dynamic-events" implementation in 1.2.2

1.2.2 / 2015-08-25
==================

  * Release 1.2.1
  * Merge pull request #8 from segmentio/dynamic-events
  * add dynamic track events

1.2.1 / 2015-08-25
==================



1.2.0 / 2015-03-16
==================

  * Add ability to send to mobile endpoint
  * Use spies to verify test results
  * Convert tests to use external fixtures
  * Change email hashing from MD5 to SHA256
  * Fix style, missing semicolons
  * Move md5 hashing function into module
  * Clean up some style
  * Update circle template

1.1.5 / 2014-12-08
==================

 * bump segmentio-integration
 * Fix build badge

1.1.4 / 2014-12-02
==================

 * bump integration proto

1.1.3 / 2014-12-02
==================

 * remove .retries()
 * fix dev deps
 * bump dev deps

1.1.2 / 2014-12-02
==================

 * bump segmentio-integration

1.1.1 / 2014-11-21
==================

 * Bumping segmentio-integration
 * Fix circle badge
 * update circle

1.1.0 / 2014-11-07
==================

  * Update project skeleton

1.0.0 / 2014-10-23
==================

  * Initial commit
