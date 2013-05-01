var db

module.exports.setUp = function (leveldown, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = leveldown(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.args = function (test) {
  test('test argument-less get() throws', function (t) {
    t.throws(
        db.get.bind(db)
      , { name: 'Error', message: 'get() requires a callback argument' }
      , 'no-arg get() throws'
    )
    t.end()
  })

  test('test callback-less, 1-arg, get() throws', function (t) {
    t.throws(
        db.get.bind(db, 'foo')
      , { name: 'Error', message: 'get() requires a callback argument' }
      , 'callback-less, 1-arg get() throws'
    )
    t.end()
  })

  test('test callback-less, 3-arg, get() throws', function (t) {
    t.throws(
        db.get.bind(db, 'foo', {})
      , { name: 'Error', message: 'get() requires a callback argument' }
      , 'callback-less, 2-arg get() throws'
    )
    t.end()
  })
}

module.exports.get = function (test) {
  test('test simple get()', function (t) {
    db.put('foo', 'bar', function (err) {
      t.notOk(err, 'no error')
      db.get('foo', function (err, value) {
        t.notOk(err, 'no error')
        t.ok(value instanceof Buffer, 'instanceof buffer failed')
        t.equal(value.toString(), 'bar')

        db.get('foo', {}, function (err, value) { // same but with {}
          t.notOk(err, 'no error')
          t.ok(value instanceof Buffer, 'instanceof buffer failed')
          t.equal(value.toString(), 'bar')

          db.get('foo', { asBuffer: false }, function (err, value) {
            t.notOk(err, 'no error')
            
            t.ok(typeof value === 'string', 'instanceof string failed')
            t.equal(value, 'bar')
            t.end()
          })
        })
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
  module.exports.get(test)
  module.exports.tearDown(test, testCommon)
}