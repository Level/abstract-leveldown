exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
}

exports.noSnapshot = function (leveldown, test, testCommon) {
  function make (run) {
    return function (t) {
      var db = leveldown(testCommon.location())
      var operations = [
        { type: 'put', key: 'a', value: 'a' },
        { type: 'put', key: 'b', value: 'b' },
        { type: 'put', key: 'c', value: 'c' }
      ]

      db.open(function (err) {
        t.ifError(err, 'no open error')

        db.batch(operations, function (err) {
          t.ifError(err, 'no batch error')

          // For this test it is important that we don't read eagerly.
          // NOTE: highWaterMark is not an abstract option atm, but
          // it is supported by leveldown, rocksdb and others.
          var it = db.iterator({ highWaterMark: 0 })

          run(db, function (err) {
            t.ifError(err, 'no run error')
            verify(t, it, db)
          })
        })
      })
    }
  }

  function verify (t, it, db) {
    testCommon.collectEntries(it, function (err, entries) {
      t.ifError(err, 'no iterator error')

      var kv = entries.map(function (entry) {
        return entry.key.toString() + entry.value.toString()
      })

      if (kv.length === 3) {
        t.same(kv, ['aa', 'bb', 'cc'], 'maybe supports snapshots')
      } else {
        t.same(kv, ['aa', 'cc'], 'ignores keys that have been deleted in the mean time')
      }

      db.close(t.end.bind(t))
    })
  }

  test('delete key after creating iterator', make(function (db, cb) {
    db.del('b', cb)
  }))

  test('batch delete key after creating iterator', make(function (db, cb) {
    db.batch([{ type: 'del', key: 'b' }], cb)
  }))
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', testCommon.tearDown)
}

exports.all = function (leveldown, test, testCommon) {
  testCommon = testCommon || require('../testCommon')
  exports.setUp(leveldown, test, testCommon)
  exports.noSnapshot(leveldown, test, testCommon)
  exports.tearDown(test, testCommon)
}
