'use strict'

const { assertAsync, illegalKeys, illegalValues, isSelf } = require('./util')

let db

exports.setUp = function (test, testCommon) {
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.args = function (test, testCommon) {
  test('test put() with illegal keys', assertAsync.ctx(function (t) {
    t.plan(illegalKeys.length * 6)

    for (const { name, key, regex } of illegalKeys) {
      db.put(key, 'value', assertAsync(function (err) {
        t.ok(err, name + ' - has error (callback)')
        t.ok(err instanceof Error, name + ' - is Error (callback)')
        t.ok(err.message.match(regex), name + ' - correct error message (callback)')
      }))

      db.put(key, 'value').catch(function (err) {
        t.ok(err instanceof Error, name + ' - is Error (promise)')
        t.ok(err.message.match(regex), name + ' - correct error message (promise)')
      })
    }
  }))

  test('test put() with illegal values', assertAsync.ctx(function (t) {
    t.plan(illegalValues.length * 6)

    for (const { name, value, regex } of illegalValues) {
      db.put('key', value, assertAsync(function (err) {
        t.ok(err, name + ' - has error (callback)')
        t.ok(err instanceof Error, name + '- is Error (callback)')
        t.ok(err.message.match(regex), name + ' - correct error message (callback)')
      }))

      db.put('key', value).catch(function (err) {
        t.ok(err instanceof Error, name + ' - is Error (promise)')
        t.ok(err.message.match(regex), name + ' - correct error message (promise)')
      })
    }
  }))
}

exports.put = function (test, testCommon) {
  test('test simple put()', assertAsync.ctx(function (t) {
    t.plan(4)

    db.put('foo', 'bar', assertAsync(function (err) {
      t.ifError(err, 'no put() error')

      db.get('foo', { asBuffer: false }, function (err, value) {
        t.ifError(err, 'no get() error')
        t.is(value, 'bar')
      })
    }))
  }))

  test('test simple put() with promise', async function (t) {
    await db.put('foo2', 'bar')
    t.is(await db.get('foo2', { asBuffer: false }), 'bar')
  })

  test('test deferred put()', assertAsync.ctx(function (t) {
    t.plan(5)

    const db = testCommon.factory()

    db.put('foo', 'bar', assertAsync(function (err) {
      t.ifError(err, 'no put() error')

      db.get('foo', { asBuffer: false }, function (err, value) {
        t.ifError(err, 'no get() error')
        t.is(value, 'bar', 'value is ok')
        db.close(t.ifError.bind(t))
      })
    }))
  }))

  test('test deferred put() with promise', async function (t) {
    const db = testCommon.factory()
    await db.put('foo', 'bar')
    t.is(await db.get('foo', { asBuffer: false }), 'bar', 'value is ok')
    return db.close()
  })
}

exports.events = function (test, testCommon) {
  test('test put() emits put event', async function (t) {
    t.plan(3)

    const db = testCommon.factory()
    await db.open()

    t.ok(db.supports.events.put)

    if (isSelf(db)) {
      db._serializeKey = (x) => x.toUpperCase()
      db._serializeValue = (x) => x.toUpperCase()
    }

    db.on('put', function (key, value) {
      t.is(key, 'a')
      t.is(value, 'b')
    })

    await db.put('a', 'b')
    await db.close()
  })

  test('test close() on put event', async function () {
    const db = testCommon.factory()
    await db.open()

    let promise

    db.on('put', function () {
      // Should not interfere with the current put() operation
      promise = db.close()
    })

    await db.put('a', 'b')
    await promise
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(t.end.bind(t))
  })
}

exports.all = function (test, testCommon) {
  exports.setUp(test, testCommon)
  exports.args(test, testCommon)
  exports.put(test, testCommon)
  exports.events(test, testCommon)
  exports.tearDown(test, testCommon)
}
