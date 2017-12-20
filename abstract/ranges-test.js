var db
var sourceData = require('./iterator-test').sourceData
var transformSource = require('./iterator-test').transformSource

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
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
      , { start: Buffer.alloc(0) }
    )
    testIteratorCollectsFullDatabase(
        'test iterator with end as empty buffer'
      , { end: Buffer.alloc(0) }
    )
  }
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

module.exports.all = function (leveldown, test, testCommon) {
  module.exports.setUp(leveldown, test, testCommon)
  module.exports.iterator(leveldown, test, testCommon, testCommon.collectEntries)
  module.exports.tearDown(test, testCommon)
}
