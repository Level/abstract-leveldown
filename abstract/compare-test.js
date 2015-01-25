var db

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.args = function (test) {
  test('test undefined _compare() throws', function (t) {
    t.throws(
      db.compare.bind(db)
      , { name: 'Error', message: '_compare() is not defined' }
      , 'undefined _compare() throws'
    )
    t.end()
  })
  test('test argument-less compare() throws', function (t) {
    db._compare = function () {}
    t.throws(
      db.compare.bind(db)
      , { name: 'Error', message: 'compare() requires valid `keyA`, `keyB` arguments' }
      , 'no-arg compare() throws'
    )
    t.end()
  })
}

module.exports.compare = function (test) {
  test('test simple compare()', function (t) {
    t.ok(db.compare('foo', 'bar') > 0, 'keyA is greater than keyB')
    t.end()
  })
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

module.exports.all = function (leveldown, test, testCommon) {
  module.exports.setUp(leveldown, test, testCommon)
  module.exports.args(test)
  module.exports.compare(test)
  module.exports.tearDown(test, testCommon)
}
