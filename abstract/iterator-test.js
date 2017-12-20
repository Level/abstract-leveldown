var db

var sourceData = (function () {
  var d = []
  var i = 0
  var k
  for (; i < 100; i++) {
    k = (i < 10 ? '0' : '') + i
    d.push({
      key: k,
      value: String(Math.random())
    })
  }
  return d
}())

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
        db.batch(sourceData.map(function (d) {
          return {
            type: 'put',
            key: d.key,
            value: d.value
          }
        }), t.end.bind(t))
      })
    })
  })

  function doTest (name, opts, expected) {
    opts.keyAsBuffer = false
    opts.valueAsBuffer = false
    test(name, function (t) {
      collectEntries(db.iterator(opts), function (err, data) {
        t.error(err)
        t.same(data, expected)
        t.end()
      })
    })
  }

  doTest('test full data collection', {}, sourceData)

  doTest('test iterator with reverse=true', {
    reverse: true
  }, sourceData.slice().reverse())

  doTest('test iterator with gte=00', {
    gte: '00'
  }, sourceData)

  doTest('test iterator with start=00 - legacy', {
    start: '00'
  }, sourceData)

  doTest('test iterator with gte=50', {
    gte: '50'
  }, sourceData.slice(50))

  doTest('test iterator with start=50 - legacy', {
    start: '50'
  }, sourceData.slice(50))

  doTest('test iterator with lte=50 and reverse=true', {
    lte: '50',
    reverse: true
  }, sourceData.slice().reverse().slice(49))

  doTest('test iterator with start=50 and reverse=true - legacy', {
    start: '50',
    reverse: true
  }, sourceData.slice().reverse().slice(49))

  doTest('test iterator with gte=49.5 (midway)', {
    gte: '49.5'
  }, sourceData.slice(50))

  doTest('test iterator with start=49.5 (midway) - legacy', {
    start: '49.5'
  }, sourceData.slice(50))

  doTest('test iterator with gte=49999 (midway)', {
    gte: '49999'
  }, sourceData.slice(50))

  doTest('test iterator with start=49999 (midway) - legacy', {
    start: '49999'
  }, sourceData.slice(50))

  doTest('test iterator with lte=49.5 (midway) and reverse=true', {
    lte: '49.5',
    reverse: true
  }, sourceData.slice().reverse().slice(50))

  doTest('test iterator with lt=49.5 (midway) and reverse=true', {
    lt: '49.5',
    reverse: true
  }, sourceData.slice().reverse().slice(50))

  doTest('test iterator with lt=50 and reverse=true', {
    lt: '50',
    reverse: true
  }, sourceData.slice().reverse().slice(50))

  doTest('test iterator with start=49.5 (midway) and reverse=true - legacy', {
    start: '49.5',
    reverse: true
  }, sourceData.slice().reverse().slice(50))

  doTest('test iterator with lte=50', {
    lte: '50'
  }, sourceData.slice(0, 51))

  doTest('test iterator with end=50 - legacy', {
    end: '50'
  }, sourceData.slice(0, 51))

  doTest('test iterator with lte=50.5 (midway)', {
    lte: '50.5'
  }, sourceData.slice(0, 51))

  doTest('test iterator with end=50.5 (midway) - legacy', {
    end: '50.5'
  }, sourceData.slice(0, 51))

  doTest('test iterator with lte=50555 (midway)', {
    lte: '50555'
  }, sourceData.slice(0, 51))

  doTest('test iterator with lt=50555 (midway)', {
    lt: '50555'
  }, sourceData.slice(0, 51))

  doTest('test iterator with end=50555 (midway) - legacy', {
    end: '50555'
  }, sourceData.slice(0, 51))

  doTest('test iterator with gte=50.5 (midway) and reverse=true', {
    gte: '50.5',
    reverse: true
  }, sourceData.slice().reverse().slice(0, 49))

  doTest('test iterator with gt=50.5 (midway) and reverse=true', {
    gt: '50.5',
    reverse: true
  }, sourceData.slice().reverse().slice(0, 49))

  doTest('test iterator with end=50.5 (midway) and reverse=true - legacy', {
    end: '50.5',
    reverse: true
  }, sourceData.slice().reverse().slice(0, 49))

  doTest('test iterator with gt=50 and reverse=true', {
    gt: '50',
    reverse: true
  }, sourceData.slice().reverse().slice(0, 49))

  // end='0', starting key is actually '00' so it should avoid it
  doTest('test iterator with lte=0', {
    lte: '0'
  }, [])

  // end='0', starting key is actually '00' so it should avoid it
  doTest('test iterator with lt=0', {
    lt: '0'
  }, [])

  // end='0', starting key is actually '00' so it should avoid it
  doTest('test iterator with end=0 - legacy', {
    end: '0'
  }, [])

  doTest('test iterator with gte=30 and lte=70', {
    gte: '30',
    lte: '70'
  }, sourceData.slice(30, 71))

  doTest('test iterator with gt=29 and lt=71', {
    gt: '29',
    lt: '71'
  }, sourceData.slice(30, 71))

  doTest('test iterator with start=30 and end=70 - legacy', {
    start: '30',
    end: '70'
  }, sourceData.slice(30, 71))

  doTest('test iterator with gte=30 and lte=70 and reverse=true', {
    lte: '70',
    gte: '30',
    reverse: true
  }, sourceData.slice().reverse().slice(29, 70))

  doTest('test iterator with gt=29 and lt=71 and reverse=true', {
    lt: '71',
    gt: '29',
    reverse: true
  }, sourceData.slice().reverse().slice(29, 70))

  doTest('test iterator with start=70 and end=30 and reverse=true - legacy', {
    start: '70',
    end: '30',
    reverse: true
  }, sourceData.slice().reverse().slice(29, 70))

  doTest('test iterator with limit=20', {
    limit: 20
  }, sourceData.slice(0, 20))

  doTest('test iterator with limit=20 and gte=20', {
    limit: 20,
    gte: '20'
  }, sourceData.slice(20, 40))

  doTest('test iterator with limit=20 and start=20 - legacy', {
    limit: 20,
    start: '20'
  }, sourceData.slice(20, 40))

  doTest('test iterator with limit=20 and reverse=true', {
    limit: 20,
    reverse: true
  }, sourceData.slice().reverse().slice(0, 20))

  doTest('test iterator with limit=20 and lte=79 and reverse=true', {
    limit: 20,
    lte: '79',
    reverse: true
  }, sourceData.slice().reverse().slice(20, 40))

  doTest('test iterator with limit=20 and start=79 and reverse=true - legacy', {
    limit: 20,
    start: '79',
    reverse: true
  }, sourceData.slice().reverse().slice(20, 40))

  // the default limit value from levelup is -1
  doTest('test iterator with limit=-1 should iterate over whole database', {
    limit: -1
  }, sourceData)

  doTest('test iterator with limit=0 should not iterate over anything', {
    limit: 0
  }, [])

  doTest('test iterator with lte after limit', {
    limit: 20,
    lte: '50'
  }, sourceData.slice(0, 20))

  doTest('test iterator with end after limit - legacy', {
    limit: 20,
    end: '50'
  }, sourceData.slice(0, 20))

  doTest('test iterator with lte before limit', {
    limit: 50,
    lte: '19'
  }, sourceData.slice(0, 20))

  doTest('test iterator with end before limit - legacy', {
    limit: 50,
    end: '19'
  }, sourceData.slice(0, 20))

  doTest('test iterator with gte after database end', {
    gte: '9a'
  }, [])

  doTest('test iterator with gt after database end', {
    gt: '9a'
  }, [])

  doTest('test iterator with start after database end - legacy', {
    start: '9a'
  }, [])

  doTest('test iterator with lte after database end and reverse=true', {
    lte: '9a',
    reverse: true
  }, sourceData.slice().reverse())

  doTest('test iterator with start after database end and reverse=true - legacy', {
    start: '9a',
    reverse: true
  }, sourceData.slice().reverse())

  doTest('test iterator with lte and gte after database and reverse=true', {
    lte: '9b',
    gte: '9a',
    reverse: true
  }, [])

  doTest('test iterator with lt and gt after database and reverse=true', {
    lt: '9b',
    gt: '9a',
    reverse: true
  }, [])

  doTest('test iterator with start and end after database and reverse=true - legacy', {
    start: '9b',
    end: '9a',
    reverse: true
  }, [])

  if (!process.browser) {
    // Can't use buffers as query keys in indexeddb (I think :P)
    doTest('test iterator with gte as empty buffer', {
      gte: Buffer.alloc(0)
    }, sourceData)
    doTest('test iterator with start as empty buffer - legacy', {
      start: Buffer.alloc(0)
    }, sourceData)
    doTest('test iterator with lte as empty buffer', {
      lte: Buffer.alloc(0)
    }, sourceData)
    doTest('test iterator with end as empty buffer - legacy', {
      end: Buffer.alloc(0)
    }, sourceData)
  }

  doTest('test iterator with gte as empty string', {
    gte: ''
  }, sourceData)
  doTest('test iterator with start as empty string - legacy', {
    start: ''
  }, sourceData)
  doTest('test iterator with gte as null', {
    gte: null
  }, sourceData)
  doTest('test iterator with start as null - legacy', {
    start: null
  }, sourceData)
  doTest('test iterator with lte as empty string', {
    lte: ''
  }, sourceData)
  doTest('test iterator with end as empty string - legacy', {
    end: ''
  }, sourceData)
  doTest('test iterator with lte as null', {
    lte: null
  }, sourceData)
  doTest('test iterator with end as null - legacy', {
    end: null
  }, sourceData)
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
