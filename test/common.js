var warned = false

function testCommon (options) {
  var factory = options.factory
  var test = options.test
  var clear = !!options.clear

  if (typeof factory !== 'function') {
    throw new TypeError('factory must be a function')
  }

  if (typeof test !== 'function') {
    throw new TypeError('test must be a function')
  }

  if (!clear && !warned) {
    warned = true
    warn(
      'A next major release of abstract-leveldown will make support of ' +
      'clear() mandatory. Prepare by enabling the tests and implementing a ' +
      'custom _clear() if necessary. See the README for details.'
    )
  }

  return {
    test: test,
    factory: factory,
    setUp: options.setUp || noopTest(),
    tearDown: options.tearDown || noopTest(),
    bufferKeys: options.bufferKeys !== false,
    createIfMissing: options.createIfMissing !== false,
    errorIfExists: options.errorIfExists !== false,
    snapshots: options.snapshots !== false,
    seek: options.seek !== false,
    clear: clear
  }
}

function warn (msg) {
  if (typeof process !== 'undefined' && process && process.emitWarning) {
    process.emitWarning(msg)
  } else if (typeof console !== 'undefined' && console && console.warn) {
    console.warn('Warning: ' + msg)
  }
}

function noopTest () {
  return function (t) {
    t.end()
  }
}

module.exports = testCommon
