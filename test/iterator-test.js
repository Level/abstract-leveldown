'use strict'

let db

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.args = function (test, testCommon) {
  test('test iterator has db reference', function (t) {
    const iterator = db.iterator()
    // For levelup & deferred-leveldown compat: may return iterator of an underlying db, that's okay.
    t.ok(iterator.db === db || iterator.db === (db.db || db._db || db))
    iterator.end(t.end.bind(t))
  })

  test('test iterator#next returns this in callback mode', function (t) {
    const iterator = db.iterator()
    const self = iterator.next(function () {})
    t.ok(iterator === self)
    iterator.end(t.end.bind(t))
  })
}

exports.sequence = function (test, testCommon) {
  test('test twice iterator#end() callback with error', function (t) {
    const iterator = db.iterator()
    iterator.end(function (err) {
      t.error(err)

      let async = false

      iterator.end(function (err2) {
        t.ok(err2, 'returned error')
        t.is(err2.name, 'Error', 'correct error')
        t.is(err2.message, 'end() already called on iterator')
        t.ok(async, 'callback is asynchronous')
        t.end()
      })

      async = true
    })
  })

  test('test iterator#next after iterator#end() callback with error', function (t) {
    const iterator = db.iterator()
    iterator.end(function (err) {
      t.error(err)

      let async = false

      iterator.next(function (err2) {
        t.ok(err2, 'returned error')
        t.is(err2.name, 'Error', 'correct error')
        t.is(err2.message, 'cannot call next() after end()', 'correct message')
        t.ok(async, 'callback is asynchronous')
        t.end()
      })

      async = true
    })
  })

  test('test twice iterator#next() throws', function (t) {
    const iterator = db.iterator()
    iterator.next(function (err) {
      t.error(err)
      iterator.end(function (err) {
        t.error(err)
        t.end()
      })
    })

    let async = false

    iterator.next(function (err) {
      t.ok(err, 'returned error')
      t.is(err.name, 'Error', 'correct error')
      t.is(err.message, 'cannot call next() before previous next() has completed')
      t.ok(async, 'callback is asynchronous')
    })

    async = true
  })
}

exports.iterator = function (test, testCommon) {
  test('test simple iterator()', function (t) {
    const data = [
      { type: 'put', key: 'foobatch1', value: 'bar1' },
      { type: 'put', key: 'foobatch2', value: 'bar2' },
      { type: 'put', key: 'foobatch3', value: 'bar3' }
    ]
    let idx = 0

    db.batch(data, function (err) {
      t.error(err)
      const iterator = db.iterator()
      const fn = function (err, key, value) {
        t.error(err)
        if (key && value) {
          if (testCommon.encodings) {
            t.is(typeof key, 'string', 'key argument is a string')
            t.is(typeof value, 'string', 'value argument is a string')
          } else {
            t.ok(Buffer.isBuffer(key), 'key argument is a Buffer')
            t.ok(Buffer.isBuffer(value), 'value argument is a Buffer')
          }
          t.is(key.toString(), data[idx].key, 'correct key')
          t.is(value.toString(), data[idx].value, 'correct value')
          db._nextTick(next)
          idx++
        } else { // end
          t.ok(err == null, 'err argument is nullish')
          t.ok(typeof key === 'undefined', 'key argument is undefined')
          t.ok(typeof value === 'undefined', 'value argument is undefined')
          t.is(idx, data.length, 'correct number of entries')
          iterator.end(function () {
            t.end()
          })
        }
      }
      const next = function () {
        iterator.next(fn)
      }

      next()
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
  exports.sequence(test, testCommon)
  exports.iterator(test, testCommon)
  exports.tearDown(test, testCommon)
}
