

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
}

module.exports.args = function (leveldown, test, testCommon) {
  var db = leveldown(testCommon.location())
  test('test database destroy no-arg throws', function (t) {
    t.throws(
        db.destroy.bind(db)
      , { name: 'Error', message: 'destroy() requires a callback argument' }
      , 'no-arg destroy() throws'
    )
    t.end()
  })

  test('test callback-less, 1-arg, destroy() throws', function (t) {
    var db = leveldown(testCommon.location())
    t.throws(
        db.destroy.bind(db, {})
      , { name: 'Error', message: 'destroy() requires a callback argument' }
      , 'callback-less, 1-arg destroy() throws'
    )
    t.end()
  })
}

module.exports.destroy = function (leveldown, test, testCommon) {
  test('test database destroy, no options', function (t) {
    var db = leveldown(testCommon.location())

    // default createIfMissing=true, errorIfExists=false
    db.destroy(function (err) {
        t.notOk(err, 'no error')
        t.end()
      })
  })

  test('test database open, options and callback', function (t) {
    var db = leveldown(testCommon.location())

    // default createIfMissing=true, errorIfExists=false
    db.open({}, function (err) {
        t.notOk(err, 'no error')
        t.end()
      })
  })
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

module.exports.all = function (leveldown, test, testCommon) {
  module.exports.setUp(test, testCommon)
  module.exports.args(leveldown, test, testCommon)
  module.exports.destroy(leveldown, test, testCommon)
  module.exports.tearDown(test, testCommon)
}