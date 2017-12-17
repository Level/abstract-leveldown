var db
var testBuffer
var test
var verifyNotFoundError = require('./util').verifyNotFoundError

function makeGetDelErrorTests (type, key, expectedError) {
  test('test get() with ' + type + ' causes error', function (t) {
    var async = false

    db.get(key, function (err) {
      t.ok(err, 'has error')
      t.ok(err instanceof Error)
      t.ok(err.message.match(expectedError), 'correct error message')
      t.ok(async, 'callback is asynchronous')
      t.end()
    })

    async = true
  })

  test('test del() with ' + type + ' causes error', function (t) {
    var async = false

    db.del(key, function (err) {
      t.ok(err, 'has error')
      t.ok(err instanceof Error)
      t.ok(err.message.match(expectedError), 'correct error message')
      t.ok(async, 'callback is asynchronous')
      t.end()
    })

    async = true
  })
}

function makePutErrorTest (type, key, value, expectedError) {
  test('test put() with ' + type + ' causes error', function (t) {
    var async = false

    db.put(key, value, function (err) {
      t.ok(err, 'has error')
      t.ok(err instanceof Error)
      t.ok(err.message.match(expectedError), 'correct error message')
      t.ok(async, 'callback is asynchronous')
      t.end()
    })

    async = true
  })
}

function makePutGetDelSuccessfulTest (type, key, value, expectedResult) {
  var hasExpectedResult = arguments.length === 4
  test('test put()/get()/del() with ' + type, function (t) {
    db.put(key, value, function (err) {
      t.error(err)
      db.get(key, function (err, _value) {
        t.error(err, 'no error, has key/value for `' + type + '`')
        t.ok(Buffer.isBuffer(_value), 'is a Buffer')
        var result = _value
        if (hasExpectedResult) {
          t.equal(result.toString(), expectedResult)
        } else {
          if (result != null) { result = _value.toString() }
          if (value != null) { value = value.toString() }
          t.equals(result, value)
        }
        db.del(key, function (err) {
          t.error(err, 'no error, deleted key/value for `' + type + '`')

          var async = false

          db.get(key, function (err, value) {
            t.ok(err, 'entry propertly deleted')
            t.ok(verifyNotFoundError(err), 'should have correct error message')
            t.equal(typeof value, 'undefined', 'value is undefined')
            t.ok(async, 'callback is asynchronous')
            t.end()
          })

          async = true
        })
      })
    })
  })
}

function makeErrorKeyTest (type, key, expectedError) {
  makeGetDelErrorTests(type, key, expectedError)
  makePutErrorTest(type, key, 'foo', expectedError)
}

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.errorKeys = function (testFunc, BufferType) {
  if (!BufferType) { BufferType = Buffer }
  test = testFunc
  makeErrorKeyTest('null key', null, /key cannot be `null` or `undefined`/)
  makeErrorKeyTest('undefined key', undefined, /key cannot be `null` or `undefined`/)
  makeErrorKeyTest('empty String key', '', /key cannot be an empty String/)
  makeErrorKeyTest('empty Buffer key', BufferType.alloc(0), /key cannot be an empty \w*Buffer/)
  makeErrorKeyTest('empty Array key', [], /key cannot be an empty String/)
}

module.exports.nonErrorKeys = function (testFunc) {
  // valid falsey keys
  test = testFunc
  makePutGetDelSuccessfulTest('`false` key', false, 'foo false')
  makePutGetDelSuccessfulTest('`0` key', 0, 'foo 0')
  makePutGetDelSuccessfulTest('`NaN` key', NaN, 'foo NaN')

  // standard String key
  makePutGetDelSuccessfulTest(
      'long String key'
    , 'some long string that I\'m using as a key for this unit test, cross your fingers dude, we\'re going in!'
    , 'foo'
  )

  if (!process.browser) {
    // Buffer key
    makePutGetDelSuccessfulTest('Buffer key', testBuffer, 'foo')
  }

  // non-empty Array as a value
  makePutGetDelSuccessfulTest('Array value', 'foo', [1, 2, 3, 4])
}

module.exports.errorValues = function () {
}

module.exports.nonErrorValues = function (testFunc, BufferType) {
  if (!BufferType) BufferType = Buffer
  // valid falsey values
  test = testFunc
  makePutGetDelSuccessfulTest('`false` value', 'foo false', false)
  makePutGetDelSuccessfulTest('`0` value', 'foo 0', 0)
  makePutGetDelSuccessfulTest('`NaN` value', 'foo NaN', NaN)

  // all of the following result in an empty-string value:

  makePutGetDelSuccessfulTest('`null` value', 'foo null', null, '')
  makePutGetDelSuccessfulTest('`undefined` value', 'foo undefined', undefined, '')
  makePutGetDelSuccessfulTest('empty String value', 'foo', '', '')
  makePutGetDelSuccessfulTest('empty Buffer value', 'foo', BufferType.alloc(0), '')
  makePutGetDelSuccessfulTest('empty Array value', 'foo', [], '')

  // standard String value
  makePutGetDelSuccessfulTest(
      'long String value'
    , 'foo'
    , 'some long string that I\'m using as a key for this unit test, cross your fingers dude, we\'re going in!'
  )

  // standard Buffer value
  makePutGetDelSuccessfulTest('Buffer value', 'foo', testBuffer)

  // non-empty Array as a key
  makePutGetDelSuccessfulTest('Array key', [1, 2, 3, 4], 'foo')
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

module.exports.all = function (leveldown, testFunc, testCommon, buffer, BufferType) {
  testBuffer = buffer
  test = testFunc
  module.exports.setUp(leveldown, test, testCommon)
  module.exports.errorKeys(test, BufferType)
  module.exports.nonErrorKeys(test)
  module.exports.errorValues(test, BufferType)
  module.exports.nonErrorValues(test, BufferType)
  module.exports.tearDown(test, testCommon)
}
