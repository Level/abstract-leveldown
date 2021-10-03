'use strict'

const { isTypedArray, assertAsync, illegalKeys, illegalValues } = require('./util')

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
  test('test simple put()', function (t) {
    db.put('foo', 'bar', function (err) {
      t.error(err)
      db.get('foo', function (err, value) {
        t.error(err)
        let result = value.toString()
        if (isTypedArray(value)) {
          result = String.fromCharCode.apply(null, new Uint16Array(value))
        }
        t.equal(result, 'bar')
        t.end()
      })
    })
  })

  test('test simple put() with promise', function (t) {
    db.put('foo', 'bar').then(function () {
      db.get('foo', function (err, value) {
        t.error(err)
        let result = value.toString()
        if (isTypedArray(value)) {
          result = String.fromCharCode.apply(null, new Uint16Array(value))
        }
        t.equal(result, 'bar')
        t.end()
      })
    }).catch(t.fail.bind(t))
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
  exports.tearDown(test, testCommon)
}
