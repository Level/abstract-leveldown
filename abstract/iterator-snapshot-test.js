var db

exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(function () {
      db.put('foobatch1', 'bar1', t.end.bind(t))
    })
  })
}

exports.snapshot = function (leveldown, test, testCommon) {
  test('iterator create snapshot correctly', function (t) {
    var iterator = db.iterator()
    db.del('foobatch1', function () {
      iterator.next(function (err, key, value) {
        t.error(err)
        t.ok(key, 'got a key')
        t.is(key.toString(), 'foobatch1', 'correct key')
        t.is(value.toString(), 'bar1', 'correct value')
        iterator.end(t.end.bind(t))
      })
    })
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

exports.all = function (leveldown, test, testCommon) {
  testCommon = testCommon || require('../testCommon')
  exports.setUp(leveldown, test, testCommon)
  exports.snapshot(leveldown, test, testCommon)
  exports.tearDown(test, testCommon)
}
