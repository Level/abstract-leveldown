var db

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.args = function (test) {
  test('test argument-less approximateSize() throws', function (t) {
    t.throws(
        db.approximateSize.bind(db)
      , { name: 'Error', message: 'approximateSize() requires valid `start`, `end` and `callback`(for async) arguments' }
      , 'no-arg approximateSize() throws'
    )
    t.end()
  })

  test('test callback-less, 1-arg, approximateSize() throws', function (t) {
    t.throws(
        db.approximateSize.bind(db, 'foo')
      , { name: 'Error', message: 'approximateSize() requires valid `start`, `end` and `callback`(for async) arguments' }
      , 'callback-less, 1-arg approximateSize() throws'
    )
    t.end()
  })

  test('test callback-less, 3-arg, approximateSize() throws', function (t) {
    t.throws(
        db.approximateSize.bind(db, function () {})
      , { name: 'Error', message: 'approximateSize() requires valid `start`, `end` and `callback`(for async) arguments' }
      , 'callback-only approximateSize() throws'
    )
    t.end()
  })

  test('test callback-only approximateSize() throws', function (t) {
    t.throws(
        db.approximateSize.bind(db, function () {})
      , { name: 'Error', message: 'approximateSize() requires valid `start`, `end` and `callback`(for async) arguments' }
      , 'callback-only approximateSize() throws'
    )
    t.end()
  })

  test('test 1-arg + callback approximateSize() throws', function (t) {
    t.throws(
        db.approximateSize.bind(db, 'foo', function () {})
      , { name: 'Error', message: 'approximateSize() requires valid `start`, `end` and `callback`(for async) arguments' }
      , '1-arg + callback approximateSize() throws'
    )
    t.end()
  })
}

module.exports.approximateSize = function (test) {
  test('test approximateSize()', function (t) {
    var data = Array.apply(null, Array(10000)).map(function () {
      return 'aaaaaaaaaa'
    }).join('')

    db.batch(
        Array.apply(null, Array(10)).map(function (x, i) {
          return { type: 'put', key: 'foo' + i, value: data }
        })
      , function (err) {
          t.error(err)

          // cycle open/close to ensure a pack to .sst

          db.close(function (err) {
            t.error(err)

            db.open(function (err) {
              t.error(err)

              db.approximateSize('!', '~', function (err, size) {
                t.error(err)

                t.equal(typeof size, 'number')
                t.ok(
                    size > 40000 // account for snappy compression
                                 // original would be ~100000
                  , 'size reports a reasonable amount (' + size + ')'
                )
                t.end()

              })
            })
          })
        }
    )
  })
}

module.exports.sync = function (test) {
  test('sync', function (t) {
    if (db._approximateSizeSync) {
      delete db.__proto__._approximateSize
    }
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
  module.exports.approximateSize(test)
  if (leveldown.prototype._approximateSizeSync) {
    module.exports.sync(test)
    module.exports.approximateSize(test)
  }
  module.exports.tearDown(test, testCommon)
}
