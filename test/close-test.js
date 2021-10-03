'use strict'

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
}

exports.close = function (test, testCommon) {
  test('test close()', function (t) {
    const db = testCommon.factory()

    db.open(function (err) {
      t.ifError(err, 'no open() error')

      db.close(function (err) {
        t.error(err)
        t.end()
      })
    })
  })

  test('test close() with promise', function (t) {
    const db = testCommon.factory()

    db.open(function (err) {
      t.ifError(err, 'no open() error')

      db.close()
        .then(t.end.bind(t))
        .catch(t.end.bind(t))
    })
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

exports.all = function (test, testCommon) {
  exports.setUp(test, testCommon)
  exports.close(test, testCommon)
  exports.tearDown(test, testCommon)
}
