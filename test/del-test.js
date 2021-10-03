'use strict'

const { verifyNotFoundError, illegalKeys, assertAsync } = require('./util')

let db

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.args = function (test, testCommon) {
  test('test del() with illegal keys', assertAsync.ctx(function (t) {
    t.plan(illegalKeys.length * 6)

    for (const { name, key, regex } of illegalKeys) {
      db.del(key, assertAsync(function (err) {
        t.ok(err, name + ' - has error (callback)')
        t.ok(err instanceof Error, name + ' - is Error (callback)')
        t.ok(err.message.match(regex), name + ' - correct error message (callback)')
      }))

      db.del(key).catch(function (err) {
        t.ok(err instanceof Error, name + ' - is Error (promise)')
        t.ok(err.message.match(regex), name + ' - correct error message (promise)')
      })
    }
  }))
}

exports.del = function (test, testCommon) {
  test('test simple del()', function (t) {
    db.put('foo', 'bar', function (err) {
      t.error(err)
      db.del('foo', function (err) {
        t.error(err)
        db.get('foo', function (err, value) {
          t.ok(err, 'entry properly deleted')
          t.ok(typeof value === 'undefined', 'value is undefined')
          t.ok(verifyNotFoundError(err), 'NotFound error')
          t.end()
        })
      })
    })
  })

  test('test simple del() with promise', function (t) {
    db.put('foo', 'bar', function (err) {
      t.error(err)
      db.del('foo').then(function (err) {
        t.error(err)
        db.get('foo', function (err, value) {
          t.ok(err, 'entry properly deleted')
          t.ok(typeof value === 'undefined', 'value is undefined')
          t.ok(verifyNotFoundError(err), 'NotFound error')
          t.end()
        })
      }).catch(t.fail.bind(t))
    })
  })

  test('test del on non-existent key', function (t) {
    db.del('blargh', function (err) {
      t.error(err)
      t.end()
    })
  })

  test('test del on non-existent key, with promise', async function (t) {
    return db.del('blargh')
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
  exports.del(test, testCommon)
  exports.tearDown(test, testCommon)
}
