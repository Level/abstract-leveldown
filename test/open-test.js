module.exports.setUp = function (test, testCommon) {
  test('setUp', testCommon.setUp)
}

module.exports.args = function (test, testCommon) {
  test('test database open no-arg throws', function (t) {
    var db = testCommon.factory()
    t.throws(
      db.open.bind(db)
      , { name: 'Error', message: 'open() requires a callback argument' }
      , 'no-arg open() throws'
    )
    t.end()
  })

  test('test callback-less, 1-arg, open() throws', function (t) {
    var db = testCommon.factory()
    t.throws(
      db.open.bind(db, {})
      , { name: 'Error', message: 'open() requires a callback argument' }
      , 'callback-less, 1-arg open() throws'
    )
    t.end()
  })
}

module.exports.open = function (test, testCommon) {
  test('test database open, no options', function (t) {
    var db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open(function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })

  test('test database open, options and callback', function (t) {
    var db = testCommon.factory()

    // default createIfMissing=true, errorIfExists=false
    db.open({}, function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })

  test('test database open, close and open', function (t) {
    var db = testCommon.factory()

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
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

module.exports.all = function (test, testCommon) {
  module.exports.setUp(test, testCommon)
  module.exports.args(test, testCommon)
  module.exports.open(test, testCommon)
  module.exports.tearDown(test, testCommon)
}
