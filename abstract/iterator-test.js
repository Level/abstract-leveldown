var db

var sourceData = (function () {
  var d = []
  var i = 0
  var k
  for (; i < 100; i++) {
    k = (i < 10 ? '0' : '') + i
    d.push({
      type: 'put',
      key: k,
      value: String(Math.random())
    })
  }
  return d
}())

var transformSource = function (d) {
  return { key: d.key, value: d.value }
}

module.exports.sourceData = sourceData
module.exports.transformSource = transformSource

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.args = function (test) {
  test('test argument-less iterator#next() throws', function (t) {
    var iterator = db.iterator()
    t.throws(
        iterator.next.bind(iterator)
      , { name: 'Error', message: 'next() requires a callback argument' }
      , 'no-arg iterator#next() throws'
    )
    iterator.end(t.end.bind(t))
  })

  test('test argument-less iterator#end() after next() throws', function (t) {
    var iterator = db.iterator()
    iterator.next(function () {
      t.throws(
          iterator.end.bind(iterator)
        , { name: 'Error', message: 'end() requires a callback argument' }
        , 'no-arg iterator#end() throws'
      )
      iterator.end(t.end.bind(t))
    })
  })

  test('test argument-less iterator#end() throws', function (t) {
    var iterator = db.iterator()
    t.throws(
        iterator.end.bind(iterator)
      , { name: 'Error', message: 'end() requires a callback argument' }
      , 'no-arg iterator#end() throws'
    )
    iterator.end(t.end.bind(t))
  })
}

module.exports.sequence = function (test) {
  test('test twice iterator#end() callback with error', function (t) {
    var iterator = db.iterator()
    iterator.end(function (err) {
      t.error(err)

      var async = false

      iterator.end(function (err2) {
        t.ok(err2, 'returned error')
        t.equal(err2.name, 'Error', 'correct error')
        t.equal(err2.message, 'end() already called on iterator')
        t.ok(async, 'callback is asynchronous')
        t.end()
      })

      async = true
    })
  })

  test('test iterator#next after iterator#end() callback with error', function (t) {
    var iterator = db.iterator()
    iterator.end(function (err) {
      t.error(err)

      var async = false

      iterator.next(function (err2) {
        t.ok(err2, 'returned error')
        t.equal(err2.name, 'Error', 'correct error')
        t.equal(err2.message, 'cannot call next() after end()', 'correct message')
        t.ok(async, 'callback is asynchronous')
        t.end()
      })

      async = true
    })
  })

  test('test twice iterator#next() throws', function (t) {
    var iterator = db.iterator()
    iterator.next(function (err) {
      t.error(err)
      iterator.end(function (err) {
        t.error(err)
        t.end()
      })
    })

    var async = false

    iterator.next(function (err) {
      t.ok(err, 'returned error')
      t.equal(err.name, 'Error', 'correct error')
      t.equal(err.message, 'cannot call next() before previous next() has completed')
      t.ok(async, 'callback is asynchronous')
    })

    async = true
  })
}

module.exports.iterator = function (leveldown, test, testCommon, collectEntries) {
  test('test simple iterator()', function (t) {
    var data = [
      { type: 'put', key: 'foobatch1', value: 'bar1' },
      { type: 'put', key: 'foobatch2', value: 'bar2' },
      { type: 'put', key: 'foobatch3', value: 'bar3' }
    ]
    var idx = 0

    db.batch(data, function (err) {
      t.error(err)
      var iterator = db.iterator()
      var fn = function (err, key, value) {
        t.error(err)
        if (key && value) {
          t.ok(Buffer.isBuffer(key), 'key argument is a Buffer')
          t.ok(Buffer.isBuffer(value), 'value argument is a Buffer')
          t.equal(key.toString(), data[idx].key, 'correct key')
          t.equal(value.toString(), data[idx].value, 'correct value')
          process.nextTick(next)
          idx++
        } else { // end
          t.ok(typeof err === 'undefined', 'err argument is undefined')
          t.ok(typeof key === 'undefined', 'key argument is undefined')
          t.ok(typeof value === 'undefined', 'value argument is undefined')
          t.equal(idx, data.length, 'correct number of entries')
          iterator.end(function () {
            t.end()
          })
        }
      }
      var next = function () {
        iterator.next(fn)
      }

      next()
    })
  })

  /** the following tests are mirroring the same series of tests in
    * LevelUP read-stream-test.js
    */

  test('setUp #2', function (t) {
    db.close(function () {
      db = leveldown(testCommon.location())
      db.open(function () {
        db.batch(sourceData, t.end.bind(t))
      })
    })
  })

  test('test full data collection', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.slice().reverse().map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with gte=0', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '00' }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start=0', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '00' }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with gte=50', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start=50', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with lte=50 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '50', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start=50 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '50', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start being a midway key (49.5)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '49.5' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start being a midway key (49.5)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '49.5' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start being a midway key (49999)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '49999' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start being a midway key (49999)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '49999' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '49.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lt: '49.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lt: '50', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '49.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 50, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(50).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end=50', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end=50', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, end: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end being a midway key (50.5)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '50.5' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end being a midway key (50.5)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, end: '50.5' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end being a midway key (50555)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '50555' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end being a midway key (50555)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lt: '50555' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end being a midway key (50555)', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, end: '50555' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 51, 'correct number of entries')
      var expected = sourceData.slice(0, 51).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '50.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 49, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(0, 49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with gt a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gt: '50.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 49, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(0, 49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end being a midway key and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, end: '50.5', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 49, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(0, 49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with gt=50 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gt: '50', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 49, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(0, 49).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // end='0', starting key is actually '00' so it should avoid it
  test('test iterator with end=0', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '0' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  // end='0', starting key is actually '00' so it should avoid it
  test('test iterator with end<0', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lt: '0' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  // legacy
  // end='0', starting key is actually '00' so it should avoid it
  test('test iterator with end=0', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, end: '0' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  test('test iterator with start=30 and end=70', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '30', lte: '70' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice(30, 71).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start=30 and end=70', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gt: '29', lt: '71' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice(30, 71).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start=30 and end=70', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '30', end: '70' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice(30, 71).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start=30 and end=70 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '70', gte: '30', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(29, 70).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start=30 and end=70 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lt: '71', gt: '29', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(29, 70).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start=30 and end=70 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '70', end: '30', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 41, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(29, 70).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with limit=20', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 20 }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with limit=20 and start=20', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '20', limit: 20 }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(20, 40).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with limit=20 and start=20', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '20', limit: 20 }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(20, 40).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with limit=20 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 20, reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with limit=20 and start=79 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '79', limit: 20, reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(20, 40).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with limit=20 and start=20 and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '79', limit: 20, reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice().reverse().slice(20, 40).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // the default limit value from levelup is -1
  test('test iterator with limit=-1 should iterate over whole database', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: -1 }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with limit=0 should not iterate over anything', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 0 }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  test('test iterator with end after limit', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 20, lte: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end after limit', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 20, end: '50' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with end before limit', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 50, lte: '19' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with end before limit', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, limit: 50, end: '19' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 20, 'correct number of entries')
      var expected = sourceData.slice(0, 20).map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start after database end', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gte: '9a' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  test('test iterator with start after database end', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, gt: '9a' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  // legacy
  test('test iterator with start after database end', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '9a' }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  test('test iterator with start after database end and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, lte: '9a', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.slice().reverse().map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  // legacy
  test('test iterator with start after database end and reverse=true', function (t) {
    collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false, start: '9a', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, sourceData.length, 'correct number of entries')
      var expected = sourceData.slice().reverse().map(transformSource)
      t.deepEqual(data, expected)
      t.end()
    })
  })

  test('test iterator with start and end after database and and reverse=true', function (t) {
    collectEntries(db.iterator({ lte: '9b', gte: '9a', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  test('test iterator with lt and gt after database and and reverse=true', function (t) {
    collectEntries(db.iterator({ lt: '9b', gt: '9a', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  // legacy
  test('test iterator with start and end after database and and reverse=true', function (t) {
    collectEntries(db.iterator({ start: '9b', end: '9a', reverse: true }), function (err, data) {
      t.error(err)
      t.equal(data.length, 0, 'correct number of entries')
      t.end()
    })
  })

  function testIteratorCollectsFullDatabase (name, iteratorOptions) {
    iteratorOptions.keyAsBuffer = false
    iteratorOptions.valueAsBuffer = false
    test(name, function (t) {
      collectEntries(db.iterator(iteratorOptions), function (err, data) {
        t.error(err)
        t.equal(data.length, 100, 'correct number of entries')
        var expected = sourceData.map(transformSource)
        t.deepEqual(data, expected)
        t.end()
      })
    })
  }

  if (!process.browser) {
    // Can't use buffers as query keys in indexeddb (I think :P)
    testIteratorCollectsFullDatabase(
        'test iterator with start as empty buffer'
      , { gte: Buffer.alloc(0) }
    )
    // legacy
    testIteratorCollectsFullDatabase(
        'test iterator with start as empty buffer'
      , { start: Buffer.alloc(0) }
    )
    testIteratorCollectsFullDatabase(
        'test iterator with end as empty buffer'
      , { lte: Buffer.alloc(0) }
    )
    // legacy
    testIteratorCollectsFullDatabase(
        'test iterator with end as empty buffer'
      , { end: Buffer.alloc(0) }
    )
  }

  testIteratorCollectsFullDatabase(
      'test iterator with start as empty string'
    , { gte: '' }
  )
  // legacy
  testIteratorCollectsFullDatabase(
      'test iterator with start as empty string'
    , { start: '' }
  )
  testIteratorCollectsFullDatabase(
      'test iterator with start as null'
    , { gte: null }
  )
  // legacy
  testIteratorCollectsFullDatabase(
      'test iterator with start as null'
    , { start: null }
  )
  testIteratorCollectsFullDatabase(
      'test iterator with end as empty string'
    , { lte: '' }
  )
  // legacy
  testIteratorCollectsFullDatabase(
      'test iterator with end as empty string'
    , { end: '' }
  )
  testIteratorCollectsFullDatabase(
      'test iterator with end as null'
    , { lte: null }
  )
  // legacy
  testIteratorCollectsFullDatabase(
      'test iterator with end as null'
    , { end: null }
  )
}

module.exports.snapshot = function (leveldown, test, testCommon) {
  test('setUp #3', function (t) {
    db.close(function () {
      db = leveldown(testCommon.location())
      db.open(function () {
        db.put('foobatch1', 'bar1', t.end.bind(t))
      })
    })
  })

  test('iterator create snapshot correctly', function (t) {
    var iterator = db.iterator()
    db.del('foobatch1', function () {
      iterator.next(function (err, key, value) {
        t.error(err)
        t.ok(key, 'got a key')
        t.equal(key.toString(), 'foobatch1', 'correct key')
        t.equal(value.toString(), 'bar1', 'correct value')
        iterator.end(t.end.bind(t))
      })
    })
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
  module.exports.sequence(test)
  module.exports.iterator(leveldown, test, testCommon, testCommon.collectEntries)
  module.exports.snapshot(leveldown, test, testCommon)
  module.exports.tearDown(test, testCommon)
}
