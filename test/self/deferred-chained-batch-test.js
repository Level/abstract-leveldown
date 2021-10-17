'use strict'

const test = require('tape')
const { mockDown } = require('../util')

// NOTE: copied from deferred-leveldown
test('deferred chained batch serializes once', function (t) {
  t.plan(9)

  let called = false

  const db = mockDown({
    _batch: function (array, options, callback) {
      called = true
      t.is(array[0] && array[0].key, 'FOO')
      t.is(array[0] && array[0].value, 'BAR')
      this._nextTick(callback)
    },
    _serializeKey (key) {
      t.is(called, false, 'not yet called')
      t.is(key, 'foo')
      return key.toUpperCase()
    },
    _serializeValue (value) {
      t.is(called, false, 'not yet called')
      t.is(value, 'bar')
      return value.toUpperCase()
    },
    _open: function (options, callback) {
      t.is(called, false, 'not yet called')
      this._nextTick(callback)
    }
  })

  db.once('open', function () {
    t.is(called, true, 'called')
  })

  db.batch().put('foo', 'bar').write(function (err) {
    t.ifError(err, 'no write() error')
  })
})
