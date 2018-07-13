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
    setUp: options.setUp || options.setup || noopTest(),
    tearDown: options.tearDown || options.teardown || noopTest()
  }
}

function noopTest () {
  return function (t) {
    t.end()
  }
}

module.exports = testCommon
