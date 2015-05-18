const test                 = require('tape')
    , sinon                = require('sinon')
    , util                 = require('util')
    , testCommon           = require('./testCommon')
    , AbstractLevelDOWN    = require('./').AbstractLevelDOWN
    , AbstractIterator     = require('./').AbstractIterator
    , AbstractChainedBatch = require('./').AbstractChainedBatch
    , isLevelDOWN          = require('./').isLevelDOWN

function factory (location) {
  return new AbstractLevelDOWN(location)
}

function createTest (opts) {
  var test

  function Test (param) {
    opts.base.call(this, param)
  }
  util.inherits(Test, opts.base)

  test = new Test(opts.options || opts.db)

  if (typeof opts.spy == 'string')
    test.spy = Test.prototype[opts.spy] = sinon.spy()

  return test
}

/*** compatibility with basic LevelDOWN API ***/

require('./abstract/leveldown-test').args(factory, test, testCommon)

require('./abstract/open-test').args(factory, test, testCommon)

require('./abstract/del-test').setUp(factory, test, testCommon)
require('./abstract/del-test').args(test)

require('./abstract/get-test').setUp(factory, test, testCommon)
require('./abstract/get-test').args(test)

require('./abstract/put-test').setUp(factory, test, testCommon)
require('./abstract/put-test').args(test)

require('./abstract/put-get-del-test').setUp(factory, test, testCommon)
require('./abstract/put-get-del-test').errorKeys(test)
//require('./abstract/put-get-del-test').nonErrorKeys(test, testCommon)
require('./abstract/put-get-del-test').errorValues(test)
//require('./abstract/test/put-get-del-test').nonErrorKeys(test, testCommon)
require('./abstract/put-get-del-test').tearDown(test, testCommon)

require('./abstract/approximate-size-test').setUp(factory, test, testCommon)
require('./abstract/approximate-size-test').args(test)

require('./abstract/batch-test').setUp(factory, test, testCommon)
require('./abstract/batch-test').args(test)

require('./abstract/chained-batch-test').setUp(factory, test, testCommon)
require('./abstract/chained-batch-test').args(test)

require('./abstract/close-test').close(factory, test, testCommon)

require('./abstract/iterator-test').setUp(factory, test, testCommon)
require('./abstract/iterator-test').args(test)
require('./abstract/iterator-test').sequence(test)

/*** extensibility ***/

test('test core extensibility', function (t) {
  var options = { foo: 'bar' }
  var test = createTest({ base: AbstractLevelDOWN, options: options })
  t.deepEqual(test.options, options, 'options set on `this`')
  t.end()
})

test('test open() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { createIfMissing: true, errorIfExists: false }
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_open' })
  test.open(expectedCb)

  t.equal(test.spy.callCount, 1, 'got _open() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _open() was correct')
  t.equal(test.spy.getCall(0).args.length, 2, 'got two arguments')
  t.deepEqual(test.spy.getCall(0).args[0], expectedOptions, 'got default options argument')
  t.equal(test.spy.getCall(0).args[1], expectedCb, 'got expected cb argument')

  test.open({ options: 1 }, expectedCb)

  expectedOptions.options = 1

  t.equal(test.spy.callCount, 2, 'got _open() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _open() was correct')
  t.equal(test.spy.getCall(1).args.length, 2, 'got two arguments')
  t.deepEqual(test.spy.getCall(1).args[0], expectedOptions, 'got expected options argument')
  t.equal(test.spy.getCall(1).args[1], expectedCb, 'got expected cb argument')
  t.end()
})

test('test close() extensibility', function (t) {
  var expectedCb = function () {}
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_close' })
  test.close(expectedCb)

  t.equal(test.spy.callCount, 1, 'got _close() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _close() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one arguments')
  t.equal(test.spy.getCall(0).args[0], expectedCb, 'got expected cb argument')
  t.end()
})

test('test get() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { asBuffer: true }
    , expectedKey = 'a key'
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_get' })
  test.get(expectedKey, expectedCb)

  t.equal(test.spy.callCount, 1, 'got _get() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _get() was correct')
  t.equal(test.spy.getCall(0).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(0).args[0], expectedKey, 'got expected key argument')
  t.deepEqual(test.spy.getCall(0).args[1], expectedOptions, 'got default options argument')
  t.equal(test.spy.getCall(0).args[2], expectedCb, 'got expected cb argument')

  test.get(expectedKey, { options: 1 }, expectedCb)

  expectedOptions.options = 1

  t.equal(test.spy.callCount, 2, 'got _get() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _get() was correct')
  t.equal(test.spy.getCall(1).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(1).args[0], expectedKey, 'got expected key argument')
  t.deepEqual(test.spy.getCall(1).args[1], expectedOptions, 'got expected options argument')
  t.equal(test.spy.getCall(1).args[2], expectedCb, 'got expected cb argument')
  t.end()
})

test('test del() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { options: 1 }
    , expectedKey = 'a key'
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_del' })
  test.del(expectedKey, expectedCb)

  t.equal(test.spy.callCount, 1, 'got _del() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _del() was correct')
  t.equal(test.spy.getCall(0).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(0).args[0], expectedKey, 'got expected key argument')
  t.deepEqual(test.spy.getCall(0).args[1], {}, 'got blank options argument')
  t.equal(test.spy.getCall(0).args[2], expectedCb, 'got expected cb argument')

  test.del(expectedKey, expectedOptions, expectedCb)

  t.equal(test.spy.callCount, 2, 'got _del() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _del() was correct')
  t.equal(test.spy.getCall(1).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(1).args[0], expectedKey, 'got expected key argument')
  t.deepEqual(test.spy.getCall(1).args[1], expectedOptions, 'got expected options argument')
  t.equal(test.spy.getCall(1).args[2], expectedCb, 'got expected cb argument')
  t.end()
})

test('test put() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { options: 1 }
    , expectedKey = 'a key'
    , expectedValue = 'a value'
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_put' })
  test.put(expectedKey, expectedValue, expectedCb)

  t.equal(test.spy.callCount, 1, 'got _put() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _put() was correct')
  t.equal(test.spy.getCall(0).args.length, 4, 'got four arguments')
  t.equal(test.spy.getCall(0).args[0], expectedKey, 'got expected key argument')
  t.equal(test.spy.getCall(0).args[1], expectedValue, 'got expected value argument')
  t.deepEqual(test.spy.getCall(0).args[2], {}, 'got blank options argument')
  t.equal(test.spy.getCall(0).args[3], expectedCb, 'got expected cb argument')

  test.put(expectedKey, expectedValue, expectedOptions, expectedCb)

  t.equal(test.spy.callCount, 2, 'got _put() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _put() was correct')
  t.equal(test.spy.getCall(1).args.length, 4, 'got four arguments')
  t.equal(test.spy.getCall(1).args[0], expectedKey, 'got expected key argument')
  t.equal(test.spy.getCall(1).args[1], expectedValue, 'got expected value argument')
  t.deepEqual(test.spy.getCall(1).args[2], expectedOptions, 'got blank options argument')
  t.equal(test.spy.getCall(1).args[3], expectedCb, 'got expected cb argument')
  t.end()
})

test('test approximateSize() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedStart = 'a start'
    , expectedEnd = 'an end'
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_approximateSize' })
  test.approximateSize(expectedStart, expectedEnd, expectedCb)

  t.equal(test.spy.callCount, 1, 'got _approximateSize() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _approximateSize() was correct')
  t.equal(test.spy.getCall(0).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(0).args[0], expectedStart, 'got expected start argument')
  t.equal(test.spy.getCall(0).args[1], expectedEnd, 'got expected end argument')
  t.equal(test.spy.getCall(0).args[2], expectedCb, 'got expected cb argument')
  t.end()
})

test('test batch() extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { options: 1 }
    , expectedArray = [ 1, 2 ]
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_batch' })

  test.batch(expectedArray, expectedCb)

  t.equal(test.spy.callCount, 1, 'got _batch() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _batch() was correct')
  t.equal(test.spy.getCall(0).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(0).args[0], expectedArray, 'got expected array argument')
  t.deepEqual(test.spy.getCall(0).args[1], {}, 'got expected options argument')
  t.equal(test.spy.getCall(0).args[2], expectedCb, 'got expected callback argument')

  test.batch(expectedArray, expectedOptions, expectedCb)

  t.equal(test.spy.callCount, 2, 'got _batch() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _batch() was correct')
  t.equal(test.spy.getCall(1).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(1).args[0], expectedArray, 'got expected array argument')
  t.deepEqual(test.spy.getCall(1).args[1], expectedOptions, 'got expected options argument')
  t.equal(test.spy.getCall(1).args[2], expectedCb, 'got expected callback argument')

  test.batch(expectedArray, null, expectedCb)

  t.equal(test.spy.callCount, 3, 'got _batch() call')
  t.equal(test.spy.getCall(2).thisValue, test, '`this` on _batch() was correct')
  t.equal(test.spy.getCall(2).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(2).args[0], expectedArray, 'got expected array argument')
  t.ok(test.spy.getCall(2).args[1], 'options should not be null')
  t.equal(test.spy.getCall(2).args[2], expectedCb, 'got expected callback argument')
  t.end()
})

test('test chained batch() (array) extensibility', function (t) {
  var expectedCb = function () {}
    , expectedOptions = { options: 1 }
    , expectedArray = [ 1, 2 ]
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_batch' })

  test.batch().put('foo', 'bar').del('bang').write(expectedCb)

  t.equal(test.spy.callCount, 1, 'got _batch() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _batch() was correct')
  t.equal(test.spy.getCall(0).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(0).args[0].length, 2, 'got expected array argument')
  t.deepEqual(test.spy.getCall(0).args[0][0], { type: 'put', key: 'foo', value: 'bar' }, 'got expected array argument[0]')
  t.deepEqual(test.spy.getCall(0).args[0][1], { type: 'del', key: 'bang' }, 'got expected array argument[1]')
  t.deepEqual(test.spy.getCall(0).args[1], {}, 'got expected options argument')
  t.equal(test.spy.getCall(0).args[2], expectedCb, 'got expected callback argument')

  test.batch().put('foo', 'bar').del('bang').write(expectedOptions, expectedCb)

  t.equal(test.spy.callCount, 2, 'got _batch() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _batch() was correct')
  t.equal(test.spy.getCall(1).args.length, 3, 'got three arguments')
  t.equal(test.spy.getCall(1).args[0].length, 2, 'got expected array argument')
  t.deepEqual(test.spy.getCall(1).args[0][0], { type: 'put', key: 'foo', value: 'bar' }, 'got expected array argument[0]')
  t.deepEqual(test.spy.getCall(1).args[0][1], { type: 'del', key: 'bang' }, 'got expected array argument[1]')
  t.deepEqual(test.spy.getCall(1).args[1], expectedOptions, 'got expected options argument')
  t.equal(test.spy.getCall(1).args[2], expectedCb, 'got expected callback argument')

  t.end()
})

test('test chained batch() (custom _chainedBatch) extensibility', function (t) {
  var test = createTest({ base: AbstractLevelDOWN, spy: '_chainedBatch' })

  test.batch()

  t.equal(test.spy.callCount, 1, 'got _chainedBatch() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _chainedBatch() was correct')

  test.batch()

  t.equal(test.spy.callCount, 2, 'got _chainedBatch() call')
  t.equal(test.spy.getCall(1).thisValue, test, '`this` on _chainedBatch() was correct')

  t.end()
})

test('test AbstractChainedBatch extensibility', function (t) {
  var db = 'foobar'
  var test = createTest({ base: AbstractChainedBatch, db: db })
  t.equal(test._db, db, 'db set on `this`')
  t.end()
})

test('test write() extensibility', function (t) {
  var spycb = sinon.spy()
    , test

  test = createTest({ base: AbstractChainedBatch, db: factory(), spy: '_write' })
  test.write(spycb)

  t.equal(test.spy.callCount, 1, 'got _write() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _write() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one argument')
  // awkward here cause of nextTick & an internal wrapped cb
  t.equal(typeof test.spy.getCall(0).args[0], 'function', 'got a callback function')
  t.equal(spycb.callCount, 0, 'spycb not called')
  test.spy.getCall(0).args[0]()
  t.equal(spycb.callCount, 1, 'spycb called, i.e. was our cb argument')
  t.end()
})

test('test put() extensibility', function (t) {
  var expectedKey = 'key'
    , expectedValue = 'value'
    , returnValue
    , test

  test = createTest({ base: AbstractChainedBatch, db: factory(), spy: '_put' })
  returnValue = test.put(expectedKey, expectedValue)

  t.equal(test.spy.callCount, 1, 'got _put call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _put() was correct')
  t.equal(test.spy.getCall(0).args.length, 2, 'got two arguments')
  t.equal(test.spy.getCall(0).args[0], expectedKey, 'got expected key argument')
  t.equal(test.spy.getCall(0).args[1], expectedValue, 'got expected value argument')
  t.equal(returnValue, test, 'get expected return value')
  t.end()
})

test('test del() extensibility', function (t) {
  var expectedKey = 'key'
    , returnValue
    , test

  test = createTest({ base: AbstractChainedBatch, db: factory(), spy: '_del' })
  returnValue = test.del(expectedKey)

  t.equal(test.spy.callCount, 1, 'got _del call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _del() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one argument')
  t.equal(test.spy.getCall(0).args[0], expectedKey, 'got expected key argument')
  t.equal(returnValue, test, 'get expected return value')
  t.end()
})

test('test clear() extensibility', function (t) {
  var returnValue
    , test

  test = createTest({ base: AbstractChainedBatch, db: factory(), spy: '_clear' })
  returnValue = test.clear()

  t.equal(test.spy.callCount, 1, 'got _clear call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _clear() was correct')
  t.equal(test.spy.getCall(0).args.length, 0, 'got zero arguments')
  t.equal(returnValue, test, 'get expected return value')
  t.end()
})

test('test iterator() extensibility', function (t) {
  var expectedOptions = { options: 1, reverse: false, keys: true, values: true, limit: -1, keyAsBuffer: true, valueAsBuffer: true }
    , test

  test = createTest({ base: AbstractLevelDOWN, spy: '_iterator' })
  test.iterator({ options: 1 })

  t.equal(test.spy.callCount, 1, 'got _close() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _close() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one arguments')
  t.deepEqual(test.spy.getCall(0).args[0], expectedOptions, 'got expected options argument')
  t.end()
})

test('test AbstractIterator extensibility', function (t) {
  var db = 'foobar'
  var test = createTest({ base: AbstractIterator, db: db })
  t.equal(test.db, db, 'db set on `this`')
  t.end()
})

test('test next() extensibility', function (t) {
  var spycb = sinon.spy()
    , test

  test = createTest({ base: AbstractIterator, spy: '_next' })
  test.next(spycb)

  t.equal(test.spy.callCount, 1, 'got _next() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _next() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one arguments')
  // awkward here cause of nextTick & an internal wrapped cb
  t.equal(typeof test.spy.getCall(0).args[0], 'function', 'got a callback function')
  t.equal(spycb.callCount, 0, 'spycb not called')
  test.spy.getCall(0).args[0]()
  t.equal(spycb.callCount, 1, 'spycb called, i.e. was our cb argument')
  t.end()
})

test('test end() extensibility', function (t) {
  var expectedCb = function () {}
    , test

  test = createTest({ base: AbstractIterator, spy: '_end' })
  test.end(expectedCb)

  t.equal(test.spy.callCount, 1, 'got _end() call')
  t.equal(test.spy.getCall(0).thisValue, test, '`this` on _end() was correct')
  t.equal(test.spy.getCall(0).args.length, 1, 'got one arguments')
  t.equal(test.spy.getCall(0).args[0], expectedCb, 'got expected cb argument')
  t.end()
})

test('isLevelDOWN', function (t) {
  t.notOk(isLevelDOWN(), 'is not a leveldown')
  t.notOk(isLevelDOWN(''), 'is not a leveldown')
  t.notOk(isLevelDOWN({}), 'is not a leveldown')
  t.notOk(isLevelDOWN({ put: function () {} }), 'is not a leveldown')
  t.ok(isLevelDOWN(new AbstractLevelDOWN('location')), 'IS a leveldown')
  t.ok(isLevelDOWN({
    open: function () {},
    close: function () {},
    get: function () {},
    put: function () {},
    del: function () {},
    batch: function () {},
    iterator: function () {}
  }), 'IS a leveldown')
  t.ok(isLevelDOWN({
    open: function () {},
    close: function () {},
    get: function () {},
    put: function () {},
    del: function () {},
    batch: function () {},
    approximateSize: function () {},
    iterator: function () {}
  }), 'IS also a leveldown')
  t.end()
})
