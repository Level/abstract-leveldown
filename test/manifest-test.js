var suite = require('level-supports/test')

module.exports = function (test, testCommon) {
  test('setUp common', testCommon.setUp)

  suite(test, testCommon)

  test('manifest has status', function (t) {
    var db = testCommon.factory()
    t.is(db.supports.status, true)
    db.close(t.end.bind(t))
  })

  test('tearDown', testCommon.tearDown)
}
