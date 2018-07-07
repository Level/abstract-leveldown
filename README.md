# abstract-leveldown

> An abstract prototype matching the [`leveldown`](https://github.com/level/leveldown/) API. Useful for extending [`levelup`](https://github.com/level/levelup) functionality by providing a replacement to `leveldown`.

[![level badge][level-badge]](https://github.com/level/awesome)
[![npm](https://img.shields.io/npm/v/abstract-leveldown.svg)](https://www.npmjs.com/package/abstract-leveldown)
![Node version](https://img.shields.io/node/v/abstract-leveldown.svg)
[![Travis](https://travis-ci.org/Level/abstract-leveldown.svg?branch=master)](http://travis-ci.org/Level/abstract-leveldown)
[![david](https://david-dm.org/Level/abstract-leveldown.svg)](https://david-dm.org/level/abstract-leveldown)
[![Coverage Status](https://coveralls.io/repos/github/Level/abstract-leveldown/badge.svg)](https://coveralls.io/github/Level/abstract-leveldown)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/dm/abstract-leveldown.svg)](https://www.npmjs.com/package/abstract-leveldown)

## Background

`abstract-leveldown` provides a simple, operational base prototype that's ready for extending. All operations have sensible *noop* defaults (operations that essentially do nothing). For example, operations such as `.open(callback)` and `.close(callback)` will invoke `callback` on a next tick. Others perform sensible actions, like `.get(key, callback)` which will always yield a `'NotFound'` error.

You add functionality by implementing the "private" underscore versions of the operations. For example, to implement a public `put()` operation you add a private `_put()` method to your object. Each of these underscore methods override the default *noop* operations and are always provided with consistent arguments, regardless of what is passed in through the public API. All methods provide argument checking and sensible defaults for optional arguments.

For example, if you call `.open()` without a callback argument you'll get an `Error('open() requires a callback argument')`. Where optional arguments are involved, your underscore methods will receive sensible defaults. A `.get(key, callback)` will pass through to a `._get(key, options, callback)` where the `options` argument is an empty object.

**If you are upgrading:** please see [UPGRADING.md](UPGRADING.md).

## Example

Let's implement a simplistic in-memory `leveldown` replacement:

```js
var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
var util = require('util')

// Constructor, passes location to the AbstractLevelDOWN constructor
function FakeLevelDOWN (location) {
  AbstractLevelDOWN.call(this, location)
}

// Our new prototype inherits from AbstractLevelDOWN
util.inherits(FakeLevelDOWN, AbstractLevelDOWN)

FakeLevelDOWN.prototype._open = function (options, callback) {
  // Initialize a memory storage object
  this._store = {}

  // Use nextTick to be a nice async citizen
  process.nextTick(callback, null, this)
}

FakeLevelDOWN.prototype._serializeKey = function (key) {
  // Safety: avoid store['__proto__'] skullduggery.
  // Below methods will receive serialized keys in their arguments.
  return '!' + key
}

FakeLevelDOWN.prototype._put = function (key, value, options, callback) {
  this._store[key] = value
  process.nextTick(callback)
}

FakeLevelDOWN.prototype._get = function (key, options, callback) {
  if (value === undefined) {
    // 'NotFound' error, consistent with LevelDOWN API
    return process.nextTick(callback, new Error('NotFound'))
  }

  process.nextTick(callback, null, value)
}

FakeLevelDOWN.prototype._del = function (key, options, callback) {
  delete this._store[key]
  process.nextTick(callback)
}
```

Now we can use our implementation with `levelup`:

```js
var levelup = require('levelup')

var db = levelup(new FakeLevelDOWN('/who/cares'))

db.put('foo', 'bar', function (err) {
  if (err) throw err

  db.get('foo', function (err, value) {
    if (err) throw err

    console.log(value) // 'bar'
  })
})
```

See [`memdown`](https://github.com/Level/memdown/) if you are looking for a complete in-memory replacement for `leveldown`.

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/abstract-leveldown.svg)](https://saucelabs.com/u/abstract-leveldown)

## Public API for consumers

### `db = constructor(..)`

Constructors typically take a `location` argument pointing to a location on disk where the data will be stored. Since not all implementations are disk-based and some are non-persistent, implementors are free to take zero or more arguments in their constructor.

### `db.status`

A read-only property. An `abstract-leveldown` compliant store can be in one of the following states:

* `'new'` - newly created, not opened or closed
* `'opening'` - waiting for the store to be opened
* `'open'` - successfully opened the store, available for use
* `'closing'` - waiting for the store to be closed
* `'closed'` - store has been successfully closed, should not be used.

### `db.open([options, ]callback)`

Open the store. The `callback` function will be called with no arguments when the store has been successfully opened, or with a single error argument if the open operation failed for any reason.

The optional `options` argument may contain:

- `createIfMissing` _(boolean, default: `true`)_: If `true` and the store doesn't exist it will be created. If `false` and the store doesn't exist, `callback` will receive an error.
- `errorIfExists` _(boolean, default: `false`)_: If `true` and the store exists, `callback` will receive an error.

Not all implementations support the above options.

### `db.close(callback)`

Close the store. The `callback` function will be called with no arguments if the operation is successful or with a single `error` argument if closing failed for any reason.

### `db.get(key[, options], callback)`

Get a value from the store by `key`. The `key` may not be `null`, `undefined`, a zero-length Buffer or zero-length string. Support of other types depends on the implementation.

The optional `options` object may contain:

* `asBuffer` _(boolean, default: `true`)_: Whether to return the `value` as a Buffer. If `false`, the returned type depends on the implementation.

The `callback` function will be called with an `Error` if the operation failed for any reason. If successful the first argument will be `null` and the second argument will be the value.

### `db.put(key, value[, options], callback)`
### `db.del(key[, options], callback)`
### `db.batch(operations[, options], callback)`
### `db.batch()`

Returns a [`chainedBatch`](#public-chained-batch).

### `db.iterator([options])`

Returns an [iterator](#public-iterator). Accepts the following range options:

- `gt` (greater than), `gte` (greater than or equal) define the lower bound of the range to be iterated. Only entries where the key is greater than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries iterated will be the same.
- `lt` (less than), `lte` (less than or equal) define the higher bound of the range to be iterated. Only entries where the key is less than (or equal to) this option will be included in the range. When `reverse=true` the order will be reversed, but the entries iterated will be the same.
- `reverse` _(boolean, default: `false`)_: iterate entries in reverse order. Beware that a reverse seek can be slower than a forward seek.
- `limit` _(number, default: `-1`)_: limit the number of entries collected by this iterator. This number represents a _maximum_ number of entries and may not be reached if you get to the end of the range first. A value of `-1` means there is no limit. When `reverse=true` the entries with the highest keys will be returned instead of the lowest keys.
- `keys` _(boolean, default: `true`)_: whether the results should contain keys. If set to `false`, calls to `iterator.next(callback)` will yield keys with a value of `undefined`.
- `values` _(boolean, default: `true`)_: whether the results should contain values. If set to `false`, calls to `iterator.next(callback)` will yield values with a value of `undefined`.

Legacy options:

- `start`: instead use `gte`
- `end`: instead use `lte`.

By default, a range option that is either an empty buffer, an empty string, `null` or `undefined` will be ignored. Note that `null` and `undefined` are valid range options at a higher level. An `abstract-leveldown` implementation is expected to either *encode* nullish, *serialize* nullish, *delegate* to an underlying store, or finally, *ignore* nullish.

In addition to range options, `iterator()` takes the following options:

- `keyAsBuffer` _(boolean, default: `true`)_: Whether to return the key of each entry as a Buffer. If `false`, the returned type depends on the implementation.
- `valueAsBuffer` _(boolean, default: `true`)_: Whether to return the value of each entry as a Buffer.

Lastly, an implementation is free to add its own options.

<a name="public-chained-batch"></a>
### `chainedBatch`

#### `chainedBatch.put(key, value)`
#### `chainedBatch.del(key)`
#### `chainedBatch.clear()`
#### `chainedBatch.write([options, ]callback)`

<a name="public-iterator"></a>
### `iterator`

An iterator keeps track of when a `next()` is in progress and when an `end()` has been called so it doesn't allow concurrent `next()` calls, it does allow `end()` while a `next()` is in progress and it doesn't allow either `next()` or `end()` after `end()` has been called.

#### `iterator.next(callback)`
#### `iterator.seek(target)`
#### `iterator.end(callback)`

## Private API for implementors

Each of these methods will receive exactly the number and order of arguments described. Optional arguments will receive sensible defaults.

### `db = AbstractLevelDOWN(location)`

The constructor expects a location argument and throws if one isn't given. If your implementation doesn't have a `location`, pass an empty string (`''`).

### `db._open(options, callback)`

Open the store. The `options` object will always have the following properties: `createIfMissing`, `errorIfExists`. If opening failed, call the `callback` function with an `Error`. Otherwise call `callback` without any arguments.

### `db._close(callback)`

Close the store. If closing failed, call the `callback` function with an `Error`. Otherwise call `callback` without any arguments.

### `db._get(key, options, callback)`

Get a value by `key`. The `options` object will always have the following properties: `asBuffer`. If the key does not exist, call the `callback` function with a `new Error('NotFound')`. Otherwise call `callback` with `null` as the first argument and the value as the second.

### `db._put(key, value, options, callback)`
### `db._del(key, options, callback)`
### `db._batch(array, options, callback)`
### `db._chainedBatch()`

The default `_chainedBatch()` returns a functional `AbstractChainedBatch` instance that uses `db._batch(array, options, callback)` under the hood. The prototype is available on the main exports for you to extend. If you want to implement chainable batch operations in a different manner then you should extend `AbstractChainedBatch` and return an instance of this prototype in the `_chainedBatch()` method:

```js
var AbstractChainedBatch = require('abstract-leveldown').AbstractChainedBatch
var inherits = require('util').inherits

function ChainedBatch (db) {
  AbstractChainedBatch.call(this, db)
}

inherits(ChainedBatch, AbstractChainedBatch)

FakeLevelDOWN.prototype._chainedBatch = function () {
  return new ChainedBatch(this)
}
```

### `db._serializeKey(key)`
### `db._serializeValue(value)`
### `db._iterator(options)`

The default `_iterator()` returns a noop `AbstractIterator` instance. The prototype is available on the main exports for you to extend. To implement iterator operations you must extend `AbstractIterator` and return an instance of this prototype in the `_iterator(options)` method.

The `options` object will always have the following properties: `reverse`, `keys`, `values`, `limit`, `keyAsBuffer` and `valueAsBuffer`.

### `iterator = AbstractIterator(db)`

Provided with the current instance of `abstract-leveldown` by default.

#### `iterator._next(callback)`
#### `iterator._seek(target)`
#### `iterator._end(callback)`

### `chainedBatch = AbstractChainedBatch(db)`

Provided with the current instance of `abstract-leveldown` by default.

#### `chainedBatch._put(key, value)`
#### `chainedBatch._del(key)`
#### `chainedBatch._clear()`
#### `chainedBatch._write(options, callback)`
#### `chainedBatch._serializeKey(key)`
#### `chainedBatch._serializeValue(value)`

## Test Suite

To prove that your implementation is `abstract-leveldown` compliant, include the test suite found in `test/`. For examples please see the test suites of implementations like [`leveldown`](https://github.com/Level/leveldown), [`level-js`](https://github.com/Level/level-js) or [`memdown`](https://github.com/Level/memdown).

As not every implementation can be fully compliant due to limitations of its underlying storage, some tests may be skipped.

| Test                   | Required | Skip if                                 |
|:-----------------------|:---------|:----------------------------------------|
| `leveldown`            | :x: | Constructor has no `location` argument       |
| `open`                 | :heavy_check_mark: | -                             |
| `put`                  | :heavy_check_mark: | -                             |
| `del`                  | :heavy_check_mark: | -                             |
| `get`                  | :heavy_check_mark: | -                             |
| `put-get-del`          | :heavy_check_mark: | -                             |
| `batch`                | :heavy_check_mark: | -                             |
| `chained-batch`        | :heavy_check_mark: | -                             |
| `close`                | :heavy_check_mark: | -                             |
| `iterator`             | :heavy_check_mark: | -                             |
| `iterator-range`       | :heavy_check_mark: | -                             |
| `iterator-snapshot`    | :x: | Reads don't operate on a snapshot<br>Snapshots are created asynchronously |
| `iterator-no-snapshot` | :x: | The `iterator-snapshot` test is included     |

If snapshots are an optional feature of your implementation, both `iterator-snapshot` and `iterator-no-snapshot` may be included.

<a name="contributing"></a>
## Contributing

`abstract-leveldown` is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [contribution guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Big Thanks

Cross-browser Testing Platform and Open Source ♥ Provided by [Sauce Labs](https://saucelabs.com).

[![Sauce Labs logo](./sauce-labs.svg)](https://saucelabs.com)

<a name="license"></a>
## License

Copyright &copy; 2013-present `abstract-leveldown` [contributors](https://github.com/level/community#contributors).

`abstract-leveldown` is licensed under the MIT license. All rights not explicitly granted in the MIT license are reserved. See the included `LICENSE.md` file for more details.

[level-badge]: http://leveldb.org/img/badge.svg
