'use strict'

exports.setUp = function (test, testCommon) {
  test('setUp', testCommon.setUp)
}

exports.open = function (test, testCommon) {
  test('test database open, no options', function (t) {
    const db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open(function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })

  test('test database open, no options, with promise', function (t) {
    const db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open().then(function () {
      db.close(t.end.bind(t))
    }).catch(t.fail.bind(t))
  })

  test('test database open, options and callback', function (t) {
    const db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open({}, function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })

  test('test database open, options with promise', function (t) {
    const db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open({}).then(function () {
      db.close(t.end.bind(t))
    })
  })

  test('test database open, close and open', function (t) {
    const db = testCommon.factory()

    db.open(function (err) {
      t.error(err)
      db.close(function (err) {
        t.error(err)
        db.open(function (err) {
          t.error(err)
          db.close(function () {
            t.end()
          })
        })
      })
    })
  })

  test('test database open, close and open with promise', function (t) {
    const db = testCommon.factory()

    db.open().then(function () {
      db.close(function (err) {
        t.error(err)
        db.open().then(function () {
          db.close(function () {
            t.end()
          })
        }).catch(t.fail.bind(t))
      })
    }).catch(t.fail.bind(t))
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

exports.all = function (test, testCommon) {
  exports.setUp(test, testCommon)
  exports.open(test, testCommon)
  exports.tearDown(test, testCommon)
}
