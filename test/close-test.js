var db

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.close = function (test, testCommon) {
  test('test close()', function (t) {
    t.throws(
      db.close.bind(db)
      , { name: 'Error', message: 'close() requires a callback argument' }
      , 'no-arg close() throws'
    )
    t.throws(
      db.close.bind(db, 'foo')
      , { name: 'Error', message: 'close() requires a callback argument' }
      , 'non-callback close() throws'
    )

    db.close(function (err) {
      t.error(err)
      t.end()
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
