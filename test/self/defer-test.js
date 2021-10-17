'use strict'

const test = require('tape')
const { mockDown } = require('../util')

test('defer() requires valid method argument', function (t) {
  t.plan(7)

  const db = mockDown()

  for (const invalid of [123, true, false, null, undefined, {}]) {
    try {
      db.defer(invalid, [])
    } catch (err) {
      t.is(err.message, 'The first argument must be a string or symbol')
    }
  }

  db.close(t.ifError.bind(t))
})

test('defer() requires valid args argument', function (t) {
  t.plan(8)

  const db = mockDown()

  for (const invalid of [123, true, false, null, undefined, {}, 'foo']) {
    try {
      db.defer('bar', invalid)
    } catch (err) {
      t.is(err.message, 'The second argument must be an array')
    }
  }

  db.close(t.ifError.bind(t))
})

test('defer() requires valid options argument', function (t) {
  t.plan(6)

  const db = mockDown()

  for (const invalid of [123, true, false, 'foo', Symbol('foo')]) {
    try {
      db.defer('bar', [], invalid)
    } catch (err) {
      t.is(err.message, 'The third argument must be null, undefined or an object')
    }
  }

  db.close(t.ifError.bind(t))
})

test('defer() requires valid thisArg option', function (t) {
  t.plan(6)

  const db = mockDown()

  for (const invalid of [123, true, false, 'foo', Symbol('foo')]) {
    try {
      db.defer('bar', [], { thisArg: invalid })
    } catch (err) {
      t.is(err.message, 'The \'thisArg\' option must be an object')
    }
  }

  db.close(t.ifError.bind(t))
})

test('defer() requires valid callback option', function (t) {
  t.plan(7)

  const db = mockDown()

  for (const invalid of [123, true, false, 'foo', Symbol('foo'), {}]) {
    try {
      db.defer('bar', [], { callback: invalid })
    } catch (err) {
      t.is(err.message, 'The \'callback\' option must be a function')
    }
  }

  db.close(t.ifError.bind(t))
})

test('defer() custom operation', function (t) {
  t.plan(6)

  const db = mockDown({
    custom (arg, callback) {
      if (this.status === 'opening') {
        t.is(arg, 123)
        this.defer('custom', [456, callback], { callback })
      } else {
        t.is(db.status, 'open')
        t.is(arg, 456)
        this._nextTick(callback, null, 987)
      }
    }
  })

  db.custom(123, function (err, result) {
    t.ifError(err, 'no custom() error')
    t.is(result, 987, 'result ok')

    db.close(t.ifError.bind(t))
  })
})

test('defer() can reject custom operation', function (t) {
  t.plan(4)

  const db = mockDown({
    _open (options, callback) {
      t.pass('opened')
      this._nextTick(callback, new Error('_open error'))
    },
    custom (arg, callback) {
      t.is(db.status, 'opening')
      this.defer('custom', [arg, callback], { callback })
    }
  })

  db.custom(123, function (err, result) {
    t.is(err && err.message, 'Database is not open')
    t.is(result, undefined, 'result ok')
  })
})

test('defer() can drop custom synchronous operation', function (t) {
  t.plan(2)

  const db = mockDown({
    _open (options, callback) {
      t.pass('opened')
      this._nextTick(callback, new Error('_open error'))
    },
    custom (arg) {
      t.is(db.status, 'opening')
      this.defer('custom', [arg])
    }
  })

  // Shouldn't throw. Can't test more than that because rejecting
  // an operation that has no callback, is supposed to do nothing.
  db.custom(123)
})
