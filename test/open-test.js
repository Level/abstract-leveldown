module.exports.setUp = function (test, testCommon) {
  test('setUp', testCommon.setUp)
}

module.exports.args = function (factory, test) {
  test('test database open no-arg throws', function (t) {
    var db = factory()
    t.throws(
      db.open.bind(db)
      , { name: 'Error', message: 'open() requires a callback argument' }
      , 'no-arg open() throws'
    )
    t.end()
  })

  test('test callback-less, 1-arg, open() throws', function (t) {
    var db = factory()
    t.throws(
      db.open.bind(db, {})
      , { name: 'Error', message: 'open() requires a callback argument' }
      , 'callback-less, 1-arg open() throws'
    )
    t.end()
  })
}

module.exports.open = function (factory, test) {
  test('test database open, no options', function (t) {
    var db = factory()

    // default createIfMissing=true, errorIfExists=false
    db.open(function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })

  test('test database open, options and callback', function (t) {
    var db = factory()

    // default createIfMissing=true, errorIfExists=false
    db.open({}, function (err) {
      t.error(err)
      db.close(function () {
        t.end()
      })
    })
  })
  test('test database open, close and open', function (t) {
    var db = factory()

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

module.exports.openAdvanced = function (factory, test) {
  test('test database open createIfMissing:false', function (t) {
    var db = factory()
    var async = false

    db.open({ createIfMissing: false }, function (err) {
      t.ok(err, 'error')
      t.ok(/does not exist/.test(err.message), 'error is about dir not existing')
      t.ok(async, 'callback is asynchronous')
      t.end()
    })

    async = true
  })

  test('test database open errorIfExists:true', function (t) {
    var db = factory()

    // make a valid database first, then close and dispose
    db.open({}, function (err) {
      t.error(err)
      db.close(function (err) {
        t.error(err)

        var async = false

        // open again with 'errorIfExists'
        db.open({ createIfMissing: false, errorIfExists: true }, function (err) {
          t.ok(err, 'error')
          t.ok(/exists/.test(err.message), 'error is about already existing')
          t.ok(async, 'callback is asynchronous')
          t.end()
        })

        async = true
      })
    })
  })
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

module.exports.all = function (factory, test, testCommon) {
  testCommon = testCommon || require('./common')
  module.exports.setUp(test, testCommon)
  module.exports.args(factory, test)
  module.exports.open(factory, test)
  module.exports.openAdvanced(factory, test)
  module.exports.tearDown(test, testCommon)
}
