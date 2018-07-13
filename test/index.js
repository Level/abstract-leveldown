var common = require('./common')

/**
 * Example usage:
 *
 * ```
 * require('abstract-leveldown/test')({
 *   test: require('tape'),
 *   factory: function () {
 *     return new MyAbstractLevelDOWN()
 *   },
 *   // If your implementation doesn't support snapshots
 *   snapshots: false
 * })
 * ```
 */
module.exports = function (options) {
  var test = options.test
  var factory = options.factory

  // TODO: consider renaming to "setup" and "teardown" (lowercase)
  var setUp = options.setUp || common.setUp
  var tearDown = options.tearDown || common.tearDown

  if (!factory) throw new TypeError('factory function is required')
  if (!test) throw new TypeError('test function is required')

  var testCommon = {
    factory: factory,
    setUp: setUp,
    tearDown: tearDown
  }

  require('./leveldown-test').args(test, testCommon)
  require('./open-test').all(test, testCommon)
  require('./close-test').close(test, testCommon)

  if (options.createIfMissing !== false) {
    require('./open-create-if-missing-test').all(test, testCommon)
  }

  if (options.errorIfExists !== false) {
    require('./open-error-if-exists-test').all(test, testCommon)
  }

  require('./put-test').all(test, testCommon)
  require('./get-test').all(test, testCommon)
  require('./del-test').all(test, testCommon)
  require('./put-get-del-test').all(test, testCommon)

  require('./batch-test').all(test, testCommon)
  require('./chained-batch-test').all(test, testCommon)

  require('./iterator-test').all(test, testCommon)
  require('./iterator-range-test').all(test, testCommon)

  if (options.snapshots !== false) {
    require('./iterator-snapshot-test').all(test, testCommon)
  } else {
    require('./iterator-no-snapshot-test').all(test, testCommon)
  }
}
