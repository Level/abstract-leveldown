function testCommon (options) {
  var factory = options.factory
  var test = options.test

  if (typeof factory !== 'function') {
    throw new TypeError('factory must be a function')
  }

  if (typeof test !== 'function') {
    throw new TypeError('test must be a function')
  }

  return {
    test: test,
    factory: factory,
    setUp: options.setUp || noopTest(),
    tearDown: options.tearDown || noopTest(),
    createIfMissing: options.createIfMissing !== false,
    errorIfExists: options.errorIfExists !== false,
    snapshots: options.snapshots !== false
  }
}

function noopTest () {
  return function (t) {
    t.end()
  }
}

module.exports = testCommon
