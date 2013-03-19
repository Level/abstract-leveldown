# Abstract LevelDOWN [![Build Status](https://secure.travis-ci.org/rvagg/node-abstract-leveldown.png)](http://travis-ci.org/rvagg/node-abstract-leveldown)

An abstract prototype matching the [LevelDOWN](https://github.com/rvagg/node-leveldown/) API. Useful for extending [LevelUP](https://github.com/rvagg/node-levelup) functionality by providing a replacement to LevelDOWN.

As of version 0.7, LevelUP allows you to pass a `'db'` option when you create a new instance. This will override the default LevelDOWN store with a LevelDOWN API compatible object.

**Abstract LevelDOWN** provides a simple, operational *noop* base prototype that's ready for extending. By default, all operations have sensible "noops" (operations that essentially do nothing). For example, simple operations such as `.open(callback)` and `.close(callback)` will simply invoke the callback (on a *next tick*). More complex operations  perform sensible actions, for example: `.get(key, callback)` will always return a `'NotFound'` `Error` on the callback.

You add functionality by implementing the underscore versions of the operations. For example, to implement a `put()` operation you add a `_put()` method to your object. Each of these underscore methods override the default *noop* operations and are always provided with **consistent arguments**, regardless of what is passed in by the client.

Additionally, all methods provide argument checking and sensible defaults for optional arguments. All bad-argument errors are compatible with LevelDOWN (they pass the LevelDOWN method arguments tests). For example, if you call `.open()` without a callback argument you'll get an `Error('open() requires a callback argument')`. Where optional arguments are involved, your underscore methods will receive sensible defaults. A `.get(key, callback)` will pass through to a `._get(key, options, callback)` where the `options` argument is an empty object.

## Example

A simplistic in-memory LevelDOWN replacement

```js
var util = require('util')
  , AbstractLevelDOWN = require('./').AbstractLevelDOWN

// constructor, passes through the 'location' argument to the AbstractLevelDOWN constructor
function FakeLevelDOWN (location) {
  AbstractLevelDOWN.call(this, location)
}

// our new prototype inherits from AbstractLevelDOWN
util.inherits(FakeLevelDOWN, AbstractLevelDOWN)

// implement some methods

FakeLevelDOWN.prototype._open = function (options, callback) {
  // initialise a memory storage object
  this._store = {}
  // optional use of nextTick to be a nice async citizen
  process.nextTick(function () { callback(null, this) }.bind(this))
}

FakeLevelDOWN.prototype._put = function (key, value, options, callback) {
  key = '$' + key // safety, to avoid key='__proto__'-type skullduggery 
  this._store[key] = value
  process.nextTick(callback)
}

FakeLevelDOWN.prototype._get = function (key, options, callback) {
  var value = this._store['$' + key]
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return process.nextTick(function () { callback(new Error('NotFound')) })
  }
  process.nextTick(function () {
    callback(null, value)
  })
}

FakeLevelDOWN.prototype._del = function (key, options, callback) {
  delete this._store['$' + key]
  process.nextTick(callback)
}

// now use it in LevelUP

var levelup = require('levelup')

var db = levelup('/who/cares/', {
  // the 'db' option replaces LevelDOWN
  db: function (location) { return new FakeLevelDOWN(location) }
})

db.put('foo', 'bar', function (err) {
  if (err) throw err
  db.get('foo', function (err, value) {
    if (err) throw err
    console.log('Got foo =', value)
  })
})
```

See [MemDOWN](https://github.com/rvagg/node-mem/) if you are looking for a complete in-memory replacement for LevelDOWN.

## Extensible API

Remember that each of these methods, if you implement them, will receive exactly the number and order of arguments described. Optional arguments will be converted to sensible defaults.

### AbstractLevelDOWN(location)
### AbstractLevelDOWN#_open(options, callback)
### AbstractLevelDOWN#_close(callback)
### AbstractLevelDOWN#_get(key, options, callback)
### AbstractLevelDOWN#_put(key, value, options, callback)
### AbstractLevelDOWN#_del(key, options, callback)
### AbstractLevelDOWN#_batch(array, options, callback)

Note: At the time of writing, the LevelDOWN `batch()` API is in flux, see the 2.0-wip branch. If `batch()` is called without argument or with only an options object then it should return a `Batch` object with chainable methods. Otherwise it will invoke a classic batch operation.

### AbstractLevelDOWN#_approximateSize(start, end, callback)
### AbstractLevelDOWN#_iterator(options)

By default an `iterator()` operation returns a blank `AbstractIterator` object. The prototype is available on the main exports for you to extend. If you want to implement iterator operations then you should extend the `AbstractIterator` and return your object in the `_iterator(options)` method.

`AbstractIterator` implements the basic state management found in LevelDOWN. It keeps track of when a `next()` is in progress and when an `end()` has been called so it doesn't allow concurrent `next()` calls, it does it allow `end()` while a `next()` is in progress and it doesn't allow either `next()` or `end()` after `end()` has been called.

### AbstractIterator(db)

Provided with the current instance of `AbstractLevelDOWN` by default.

### AbstractIterator#_next(callback)
### AbstractIterator#_end(callback)

## Licence

Abstract LevelDOWN is Copyright (c) 2013 Rod Vagg [@rvagg](https://twitter.com/rvagg) and licensed under the MIT licence. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.