var xtend = require('xtend')
var hasOwnProperty = Object.prototype.hasOwnProperty

module.exports = function (test, testCommon) {
  test('setUp common', testCommon.setUp)

  test('db has manifest', function (t) {
    var db = testCommon.factory()
    var supports = db.supports

    t.ok(isObject(supports))
    t.ok(isObject(supports.additionalMethods))

    for (var k in supports) {
      if (!hasOwnProperty.call(supports, k)) continue
      if (k === 'additionalMethods') continue

      t.is(typeof supports[k], 'boolean', k)
    }

    for (var m in supports.additionalMethods) {
      if (!hasOwnProperty.call(supports.additionalMethods, m)) continue
      t.ok(isObject(supports.additionalMethods[m]), m)
    }

    var before = xtend(supports, {
      additionalMethods: xtend(supports.additionalMethods)
    })

    db.open(function (err) {
      t.ifError(err, 'no open error')
      t.same(db.supports, before, 'manifest did not change after open')

      db.close(function (err) {
        t.ifError(err, 'no close error')
        t.same(db.supports, before, 'manifest did not change after close')
        t.end()
      })
    })
  })

  test('tearDown', testCommon.tearDown)
}

function isObject (o) {
  return typeof o === 'object' && o !== null
}
