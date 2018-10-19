module.exports = function (test, testCommon) {
  test('setUp common', testCommon.setUp)

  make('iterator is seekable', function (db, t, done) {
    var ite = db.iterator()
    ite.seek('two')
    ite.next(function (err, key, value) {
      t.error(err, 'no error')
      t.same(key.toString(), 'two', 'key matches')
      t.same(value.toString(), '2', 'value matches')
      ite.next(function (err, key, value) {
        t.error(err, 'no error')
        t.same(key, undefined, 'end of iterator')
        t.same(value, undefined, 'end of iterator')
        ite.end(done)
      })
    })
  })

  make('iterator is seekable with buffer', function (db, t, done) {
    var ite = db.iterator()
    ite.seek(Buffer.from('two'))
    ite.next(function (err, key, value) {
      t.error(err, 'no error from next()')
      t.equal(key.toString(), 'two', 'key matches')
      t.equal(value.toString(), '2', 'value matches')
      ite.next(function (err, key, value) {
        t.error(err, 'no error from next()')
        t.equal(key, undefined, 'end of iterator')
        t.equal(value, undefined, 'end of iterator')
        ite.end(done)
      })
    })
  })

  make('reverse seek in the middle', function (db, t, done) {
    var ite = db.iterator({ reverse: true, limit: 1 })
    ite.seek('three!')
    ite.next(function (err, key, value) {
      t.error(err, 'no error')
      t.same(key.toString(), 'three', 'key matches')
      t.same(value.toString(), '3', 'value matches')
      ite.end(done)
    })
  })

  make('iterator invalid seek', function (db, t, done) {
    var ite = db.iterator()
    ite.seek('zzz')
    ite.next(function (err, key, value) {
      t.error(err, 'no error')
      t.same(key, undefined, 'end of iterator')
      t.same(value, undefined, 'end of iterator')
      ite.end(done)
    })
  })

  make('reverse seek from invalid range', function (db, t, done) {
    var ite = db.iterator({ reverse: true })
    ite.seek('zzz')
    ite.next(function (err, key, value) {
      t.error(err, 'no error')
      t.same(key.toString(), 'two')
      t.same(value.toString(), '2')
      ite.end(done)
    })
  })

  // TODO: include in own tests (self.js)
  make('iterator seek before next has completed', function (db, t, done) {
    var ite = db.iterator()
    var error

    ite.next(function (err, key, value) {
      t.error(err, 'no error from next()')
      ite.end(done)
    })

    try {
      ite.seek('two')
    } catch (err) {
      error = err.message
    }

    t.is(error, 'cannot call seek() before next() has completed', 'got error')
  })

  // TODO: include in own tests (self.js)
  make('iterator seek after end', function (db, t, done) {
    var ite = db.iterator()
    ite.next(function (err, key, value) {
      t.error(err, 'no error from next()')
      ite.end(function (err) {
        t.error(err, 'no error from end()')
        var error

        try {
          ite.seek('two')
        } catch (err) {
          error = err.message
        }

        t.is(error, 'cannot call seek() after end()', 'got error')
        done()
      })
    })
  })

  // TODO: don't use make() for this test, we have our own batch
  make('iterator seek respects range', function (db, t, done) {
    // Can't use Array.fill() because IE
    var ops = []

    for (var i = 0; i < 10; i++) {
      ops.push({ type: 'put', key: String(i), value: String(i) })
    }

    db.batch(ops, function (err) {
      t.error(err, 'no error from batch()')

      var pending = 0

      expect({ gt: '5' }, '4', undefined)
      expect({ gt: '5' }, '5', undefined)
      expect({ gt: '5' }, '6', '6')

      expect({ gte: '5' }, '4', undefined)
      expect({ gte: '5' }, '5', '5')
      expect({ gte: '5' }, '6', '6')

      expect({ start: '5' }, '4', undefined)
      expect({ start: '5' }, '5', '5')
      expect({ start: '5' }, '6', '6')

      expect({ lt: '5' }, '4', '4')
      expect({ lt: '5' }, '5', undefined)
      expect({ lt: '5' }, '6', undefined)

      expect({ lte: '5' }, '4', '4')
      expect({ lte: '5' }, '5', '5')
      expect({ lte: '5' }, '6', undefined)

      expect({ end: '5' }, '4', '4')
      expect({ end: '5' }, '5', '5')
      expect({ end: '5' }, '6', undefined)

      expect({ lt: '5', reverse: true }, '4', '4')
      expect({ lt: '5', reverse: true }, '5', undefined)
      expect({ lt: '5', reverse: true }, '6', undefined)

      expect({ lte: '5', reverse: true }, '4', '4')
      expect({ lte: '5', reverse: true }, '5', '5')
      expect({ lte: '5', reverse: true }, '6', undefined)

      expect({ start: '5', reverse: true }, '4', '4')
      expect({ start: '5', reverse: true }, '5', '5')
      expect({ start: '5', reverse: true }, '6', undefined)

      expect({ gt: '5', reverse: true }, '4', undefined)
      expect({ gt: '5', reverse: true }, '5', undefined)
      expect({ gt: '5', reverse: true }, '6', '6')

      expect({ gte: '5', reverse: true }, '4', undefined)
      expect({ gte: '5', reverse: true }, '5', '5')
      expect({ gte: '5', reverse: true }, '6', '6')

      expect({ end: '5', reverse: true }, '4', undefined)
      expect({ end: '5', reverse: true }, '5', '5')
      expect({ end: '5', reverse: true }, '6', '6')

      expect({ gt: '7', lt: '8' }, '7', undefined)
      expect({ gte: '7', lt: '8' }, '7', '7')
      expect({ gte: '7', lt: '8' }, '8', undefined)
      expect({ gt: '7', lte: '8' }, '8', '8')

      function expect (range, target, expected) {
        pending++
        var ite = db.iterator(range)

        ite.seek(target)
        ite.next(function (err, key, value) {
          t.error(err, 'no error from next()')

          var json = JSON.stringify(range)
          var msg = 'seek(' + target + ') on ' + json + ' yields ' + expected

          if (expected === undefined) {
            t.equal(value, undefined, msg)
          } else {
            t.equal(value.toString(), expected, msg)
          }

          ite.end(function (err) {
            t.error(err, 'no error from end()')
            if (!--pending) done()
          })
        })
      }
    })
  })

  test('tearDown', testCommon.tearDown)

  function make (name, testFn) {
    test(name, function (t) {
      var db = testCommon.factory()
      var done = function (err) {
        t.error(err, 'no error from done()')

        db.close(function (err) {
          t.error(err, 'no error from close()')
          t.end()
        })
      }

      db.open(function (err) {
        t.error(err, 'no error from open()')

        db.batch([
          { type: 'put', key: 'one', value: '1' },
          { type: 'put', key: 'two', value: '2' },
          { type: 'put', key: 'three', value: '3' }
        ], function (err) {
          t.error(err, 'no error from batch()')
          testFn(db, t, done)
        })
      })
    })
  }
}
