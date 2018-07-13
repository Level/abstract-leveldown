module.exports.setUp = function (test, testCommon) {
  test('setUp', testCommon.setUp)
}

module.exports.errorIfExists = function (test, testCommon) {
  test('test database open errorIfExists:true', function (t) {
    var db = testCommon.factory()

    db.open({}, function (err) {
      t.error(err)
      db.close(function (err) {
        t.error(err)

        var async = false

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

module.exports.all = function (test, testCommon) {
  module.exports.setUp(test, testCommon)
  module.exports.errorIfExists(test, testCommon)
  module.exports.tearDown(test, testCommon)
}
