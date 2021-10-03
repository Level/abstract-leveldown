'use strict'

const suite = require('level-supports/test')

module.exports = function (test, testCommon) {
  suite(test, testCommon)

  test('manifest has expected properties', function (t) {
    const db = testCommon.factory()

    t.is(db.supports.status, true)
    t.is(db.supports.promises, true)
    t.is(db.supports.clear, true)
    t.is(db.supports.getMany, true)

    db.close(t.end.bind(t))
  })
}
