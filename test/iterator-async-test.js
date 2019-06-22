var db

exports.setUp = function (test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = testCommon.factory()
    db.open(t.end.bind(t))
  })
}

exports.asyncIterator = function (test, testCommon) {
  test('test iterator#next returns this', function (t) {
    var iterator = db.iterator()
    var self = iterator.next(function () { })
    t.ok(iterator === self)
    iterator.end(t.end.bind(t))
  })

  test('test simple asyncIterator()', async function (t) {
    var expected = [
      { key: 'foobatch1', value: 'bar1' },
      { key: 'foobatch2', value: 'bar2' },
      { key: 'foobatch3', value: 'bar3' }
    ]

    var data = expected.map(x => { return { type: 'put', key: x.key, value: x.value } })

    db.batch(data, (err) => {
      t.error(err, 'no error');

      (async function () {
        var _it = db.iterator()
        var itItems = expected.slice(0)
        _it.next = function (cb) {
          var kv = itItems.shift()
          cb(undefined, kv ? kv.key : undefined, kv ? kv.value : undefined)
        }

        var results = []
        for await (let item of _it) {
          results.push(item)
        }
        t.deepEqual(results, expected, 'iterated sequence is correct')
        t.end()
      })().catch((err) => { t.error(err); t.end() })
    })
  })
}

exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

exports.all = function (test, testCommon) {
  exports.setUp(test, testCommon)
  exports.iterator(test, testCommon)
  exports.tearDown(test, testCommon)
}
