'use strict'

const verifyNotFoundError = require('./util').verifyNotFoundError
const isTypedArray = require('./util').isTypedArray

let db

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.args = function (test, testCommon) {
  testCommon.promises || test('test argument-less map() throws', function (t) {
    t.throws(
      db.map.bind(db),
      /Error: map\(\) requires a callback argument/,
      'no-arg map() throws'
    )
    t.end()
  })

  testCommon.promises || test('test callback-less, 1-arg, map() throws', function (t) {
    t.throws(
      db.map.bind(db, 'foo'),
      /Error: map\(\) requires a callback argument/,
      'callback-less, 1-arg map() throws'
    )
    t.end()
  })

  testCommon.promises || test('test callback-less, 3-arg, map() throws', function (t) {
    t.throws(
      db.map.bind(db, 'foo', {}),
      /Error: map\(\) requires a callback argument/,
      'callback-less, 2-arg map() throws'
    )
    t.end()
  })

  testCommon.serialize && test('test custom _serialize*', function (t) {
    t.plan(3)
    const db = testCommon.factory()
    db._serializeKey = function (data) { return data }
    db._map = function (keys, options, callback) {
      t.deepEqual(keys, [{ foo: 'bar' }])
      this._nextTick(callback)
    }
    db.open(function () {
      db.map([{ foo: 'bar' }], function (err) {
        t.error(err)
        db.close(t.error.bind(t))
      })
    })
  })
}

exports.map = function (test, testCommon) {
  test('test simple map()', function (t) {
    db.put('foo', 'bar', function (err) {
      t.error(err)
      db.put('ray', 'tay', function (err) {
        t.error(err)
        db.map(['foo', 'ray'], function (err, value) {
          t.error(err)

          let result

          t.ok(Array.isArray(value), 'value should be an array')

          if (!testCommon.encodings) {
            t.ok(typeof value[0] !== 'string' && typeof value[1] !== 'string', 'should not be string by default')

            result = value.forEah((x) => {
              if (isTypedArray(x)) {
                return String.fromCharCode.apply(null, new Uint16Array(x))
              } else {
                t.ok(typeof Buffer !== 'undefined' && x instanceof Buffer)
                try {
                  return x.toString()
                } catch (e) {
                  t.error(e, 'should not throw when converting value to a string')
                }
              }
            })
          } else {
            result = value
          }

          t.deepEqual(result, ['bar', 'tay'])

          db.map(['foo', 'ray'], {}, function (err, value) { // same but with {}
            t.error(err)

            let result

            t.ok(Array.isArray(value), 'value should be an array')

            if (!testCommon.encodings) {
              t.ok(typeof value[0] !== 'string' && typeof value[1] !== 'string', 'should not be string by default')

              result = value.map(function (x) {
                if (isTypedArray(x)) {
                  return String.fromCharCode.apply(null, new Uint16Array(x))
                } else {
                  t.ok(typeof Buffer !== 'undefined' && x instanceof Buffer)
                  try {
                    return x.toString()
                  } catch (e) {
                    t.error(e, 'should not throw when converting value to a string')
                  }
                }
                return x
              })
            } else {
              result = value
            }

            t.deepEqual(result, ['bar', 'tay'])

            db.map(['foo', 'ray'], { asBuffer: false }, function (err, value) {
              t.error(err)
              t.ok(Array.isArray(value), 'value should be an array')
              t.ok(typeof value === 'string', 'should be string if not buffer')
              t.deepEqual(value, ['bar', 'tay'])
              t.end()
            })
          })
        })
      })
    })
  })

  test('test simultaniously map()', function (t) {
    db.put('hello', 'world', function (err) {
      t.error(err)
      let r = 0
      const done = function () {
        if (++r === 20) { t.end() }
      }
      let i = 0
      let j = 0

      for (; i < 10; ++i) {
        db.map(['hello'], function (err, value) {
          t.error(err)
          t.deepEqual(value.map(x => x.toString()), ['world'])
          done()
        })
      }

      for (; j < 10; ++j) {
        db.map(['not found'], function (err, value) {
          t.ok(err, 'should error')
          t.ok(verifyNotFoundError(err), 'should have correct error message')
          t.ok(typeof value === 'undefined', 'value is undefined')
          done()
        })
      }
    })
  })

  test('test map() not found error is asynchronous', function (t) {
    t.plan(5)

    db.put('hello', 'world', function (err) {
      t.error(err)

      let async = false

      db.map(['not found'], function (err, value) {
        t.ok(err, 'should error')
        t.ok(verifyNotFoundError(err), 'should have correct error message')
        t.ok(typeof value === 'undefined', 'value is undefined')
        t.ok(async, 'callback is asynchronous')
      })

      async = true
    })
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

exports.all = function (test, testCommon) {
  exports.setUp(test, testCommon)
  exports.args(test, testCommon)
  exports.map(test, testCommon)
  exports.tearDown(test, testCommon)
}
