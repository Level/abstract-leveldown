module.exports.setUp = function (test, testCommon) {
  test('setUp', testCommon.setUp)
}

module.exports.createIfMissing = function (test, testCommon) {
  test('test database open createIfMissing:false', function (t) {
    var db = testCommon.factory()
    var async = false

    db.open({ createIfMissing: false }, function (err) {
      t.ok(err, 'error')
      t.ok(/does not exist/.test(err.message), 'error is about dir not existing')
      t.ok(async, 'callback is asynchronous')
      t.end()
    })

    async = true
  })
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

module.exports.all = function (test, testCommon) {
  testCommon = testCommon || require('./common')
  module.exports.setUp(test, testCommon)
  module.exports.createIfMissing(test, testCommon)
  module.exports.tearDown(test, testCommon)
}
