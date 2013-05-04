/**** SETUP & UTILITY STUFF ****/

var db
  , testBuffer
  , test
  , makeGetDelErrorTests = function (type, key, expectedError) {
      test('test get() with ' + type + ' causes error', function (t) {
        db.get(key, function (err) {
          t.ok(err, 'has error')
          t.ok(err instanceof Error)
          t.ok(err.message.match(expectedError), 'correct error message')
          t.end()
        })
      })

      test('test del() with ' + type + ' causes error', function (t) {
        db.del(key, function (err) {
          t.ok(err, 'has error')
          t.ok(err instanceof Error)
          t.ok(err.message.match(expectedError), 'correct error message')
          t.end()
        })
      })
    }

  , makePutErrorTest = function (type, key, value, expectedError) {
      test('test put() with ' + type + ' causes error', function (t) {
        db.put(key, value, function (err) {
          t.ok(err, 'has error')
          t.ok(err instanceof Error)
          t.ok(err.message.match(expectedError), 'correct error message')
          t.end()
        })
      })
    }

  , makePutGetDelSuccessfulTest = function (type, key, value) {
      test('test put()/get()/del() with ' + type, function (t) {
        db.put(key, value, function (err) {
          t.notOk(err, 'no error')
          db.get(key, function (err, _value) {
            t.notOk(err, 'no error, has key/value for `' + key + '`')

            var result = _value.toString()
            if (_value instanceof ArrayBuffer)
              result = String.fromCharCode.apply(null, new Uint16Array(_value))

            t.equals(result, value.toString())
            db.del(key, function (err) {
              t.notOk(err, 'no error, deleted key/value for `' + key + '`')
              db.get(key, function (err) {
                t.ok(err, 'entry propertly deleted')
                t.ok(err.message.match(/NotFound/))
                t.end()
              })
            })
          })
        })
      })
    }

  , makeErrorKeyTest = function (type, key, expectedError) {
      makeGetDelErrorTests(type, key, expectedError)
      makePutErrorTest(type, key, 'foo', expectedError)
    }

/**** SETUP ENVIRONMENT ****/

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

/**** TEST ERROR KEYS ****/

module.exports.errorKeys = function (testFunc) {
  test = testFunc
  makeErrorKeyTest('null key', null, /key cannot be `null` or `undefined`/)
  makeErrorKeyTest('undefined key', undefined, /key cannot be `null` or `undefined`/)
  makeErrorKeyTest('empty String key', '', /key cannot be an empty String/)
  if (process.browser) makeErrorKeyTest('empty ArrayBuffer key', new ArrayBuffer(0), /key cannot be an empty ArrayBuffer/)
  else makeErrorKeyTest('empty Buffer key', new Buffer(0), /key cannot be an empty Buffer/)
  makeErrorKeyTest('empty Array key', [], /key cannot be an empty String/)
}

/**** TEST NON-ERROR KEYS ****/

module.exports.nonErrorKeys = function () {
  // valid falsey keys
  makePutGetDelSuccessfulTest('`false` key', false, 'foo false')
  makePutGetDelSuccessfulTest('`0` key', 0, 'foo 0')
  makePutGetDelSuccessfulTest('`NaN` key', NaN, 'foo NaN')

  // standard String key
  makePutGetDelSuccessfulTest(
      'long String key'
    , 'some long string that I\'m using as a key for this unit test, cross your fingers dude, we\'re going in!'
    , 'foo'
  )

  // Buffer key
  makePutGetDelSuccessfulTest('Buffer key', testBuffer, 'foo')

  // non-empty Array as a key
  makePutGetDelSuccessfulTest('Array value', 'foo', [1,2,3,4])
}

/**** TEST ERROR VALUES ****/

module.exports.errorValues = function () {
  makePutErrorTest('null value', 'foo', null, /value cannot be `null` or `undefined`/)
  makePutErrorTest('undefined value', 'foo', undefined, /value cannot be `null` or `undefined`/)
  makePutErrorTest('empty String value', 'foo', '', /value cannot be an empty String/)
  if (process.browser) makePutErrorTest('empty ArrayBuffer value', 'foo', new ArrayBuffer(0), /value cannot be an empty ArrayBuffer/)
  else makePutErrorTest('empty Buffer value', 'foo', new Buffer(0), /value cannot be an empty Buffer/)
  makePutErrorTest('empty Array value', 'foo', [], /value cannot be an empty String/)
}

module.exports.nonErrorKeys = function () {
  // valid falsey values
  makePutGetDelSuccessfulTest('`false` value', 'foo false', false)
  makePutGetDelSuccessfulTest('`0` value', 'foo 0', 0)
  makePutGetDelSuccessfulTest('`NaN` value', 'foo NaN', NaN)

  // standard String value
  makePutGetDelSuccessfulTest(
      'long String value'
    , 'foo'
    , 'some long string that I\'m using as a key for this unit test, cross your fingers dude, we\'re going in!'
  )

  // standard Buffer value
  makePutGetDelSuccessfulTest('Buffer key', 'foo', testBuffer)

  // non-empty Array as a value
  makePutGetDelSuccessfulTest('Array value', [1,2,3,4], 'foo')
}

/**** CLEANUP ENVIRONMENT ****/

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

module.exports.all = function (leveldown, testFunc, testCommon, buffer) {
  testBuffer = buffer
  test = testFunc
  module.exports.setUp(leveldown, test, testCommon)
  module.exports.errorKeys(test)
  module.exports.nonErrorKeys()
  module.exports.errorValues()
  module.exports.nonErrorKeys()
  module.exports.tearDown(test, testCommon)
}
