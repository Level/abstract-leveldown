# Upgrade Guide

This document describes breaking changes and how to upgrade. For a complete list of changes including minor and patch releases, please refer to the changelog.

## Unreleased

### `location` was removed

`AbstractLevelDOWN` is no longer associated with a `location`. It's up to the implementation to handle it if it's required.

If you previously did:

```js
function YourDOWN (location) {
  AbstractLevelDOWN.call(this, location)
}
```

You must now do:

```js
function YourDOWN (location) {
  this.location = location
  AbstractLevelDOWN.call(this)
}
```

### Abstract test suite has moved to a single entry point

With this move, `testCommon` is gone. If you previously did:

```js
const test = require('tape')
const testCommon = require('abstract-leveldown/testCommon')
const YourDOWN = require('.')

require('abstract-leveldown/abstract/get-test').all(YourDOWN, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(YourDOWN, test, testCommon)

// etc
```

You must now do:

```js
const test = require('tape')
const YourDOWN = require('.')

require('abstract-leveldown/test')({
  test: test,
  factory: function () {
    return new YourDOWN()
  }
})
```

As part of removing `location`, the abstract tests no longer use `testCommon.location()`. Instead an implementation *must* implement `factory()` which *must* return a unique database instance. This allows implementations to pass options to their constructor.

The `testCommon.cleanup` method has been removed. Because `factory()` returns a unique database instance, cleanup should no longer be necessary. The `testCommon.lastLocation` method has also been removed as there is no remaining use of it in abstract tests.

Previously, implementations using the default `testCommon` had to include `rimraf` in their `devDependencies` and browser-based implementations had to exclude `rimraf` from browserify builds. This is no longer the case.

If your implementation is disk-based we recommend using `tempy` (or similar) to create unique temporary directories. Together with `factory()` your setup could now look something like:

```js
const test = require('tape')
const tempy = require('tempy')
const YourDOWN = require('.')

require('abstract-leveldown/test')({
  test: test,
  factory: function () {
    return new YourDOWN(tempy.directory())
  }
})
```

### The `collectEntries` utility has moved

The `testCommon.collectEntries` method has moved to the npm package  `level-concat-iterator`. If your (additional) tests depend on `collectEntries` and you previously did:

```js
testCommon.collectEntries(iterator, function (err, entries) {})
```

You must now do:

```js
const concat = require('level-concat-iterator')
concat(iterator, function (err, entries) {})
```

### Setup and teardown have moved

The `testCommon.setUp` and `testCommon.tearDown` methods have moved to test options. They are now noops by default:

```js
require('abstract-leveldown/test')({
  setup: function (t) {
    t.end()
  },
  teardown: function (t) {
    t.end()
  }
})
```

### Optional tests have been separated

If your implementation does not support snapshots, or the `createIfMissing` and `errorIfExists` options to `db.open`, the relevant tests may be skipped. To skip all three:

```js
require('abstract-leveldown/test')({
  test: test,
  factory: function () {
    return new YourDOWN()
  },
  snapshots: false,
  createIfMissing: false,
  errorIfExists: false
})
```

### Seeking became part of official API

If your implementation previously defined the public `iterator.seek(target)`, it must now define the private `iterator._seek(target)`. The new public API is equal to the reference implementation of `leveldown` except for two differences:

- The `target` argument is not type checked, this is up to the implementation.
- The `target` argument is passed through `db._serializeKey`.

Please see [README.md](README.md) for details.

### Chained batch has been refactored

- The default `_clear` method is no longer a noop; instead it clears the operations queued by `_put` and/or `_del`
- The `_write` method now takes an `options` object as its first argument
- The `db` argument in the constructor became mandatory, as well the `_db` property on the instance.

## v5

Dropped support for node 4. No other breaking changes.

## v4

#### default `testCommon` parameter

The `testCommon` parameter will now default to `abstract-leveldown/testCommon.js`. You can omit this parameter, unless your implementation needs a custom version.

If your code today looks something like:

```js
const test = require('tape')
const testCommon = require('abstract-leveldown/testCommon')
const leveldown = require('./your-leveldown')
const abstract = require('abstract-leveldown/abstract/get-test')

abstract.all(leveldown, test, testCommon)
```

You can simplify it to:

```js
const test = require('tape')
const leveldown = require('./your-leveldown')
const abstract = require('abstract-leveldown/abstract/get-test')

abstract.all(leveldown, test)
```

#### `testBuffer` parameter removed

The `abstract/put-get-del-test.js` previously took a custom `testBuffer` parameter. After an [analysis](https://github.com/Level/abstract-leveldown/pull/175#issuecomment-353867144) of various implementations we came to the conclusion that the parameter has no use.

If your implementation is using this abstract test, change from:

```js
const test = require('tape')
const testCommon = require('abstract-leveldown/testCommon')
const leveldown = require('./your-leveldown')
const fs = require('fs')
const path = require('path')
const testBuffer = fs.readFileSync(path.join(__dirname, 'data/testdata.bin'))
const abstract = require('abstract-leveldown/abstract/put-get-del-test')

abstract.all(leveldown, test, testBuffer, testCommon)
```

to:

```js
const test = require('tape')
const testCommon = require('abstract-leveldown/testCommon')
const leveldown = require('./your-leveldown')
const abstract = require('abstract-leveldown/abstract/put-get-del-test')

abstract.all(leveldown, test, testCommon)
```

or if `testCommon` is also redundant, to:

```js
const test = require('tape')
const leveldown = require('./your-leveldown')
const abstract = require('abstract-leveldown/abstract/put-get-del-test')

abstract.all(leveldown, test)
```

#### `.approximateSize` method removed

The `.approximateSize` method has been removed from the public API. It is heavily related to `LevelDB` and more often than not, other stores lack the native primitives to implement this. If you did implement the internal `_approximateSize` method, that is now dead code. To preserve the method in your public API, rename it to `approximateSize` and also take care of the initialization code. Look to `leveldown` for inspiration.

Also, the corresponding abstract tests have been removed, so your implementation can no longer require `abstract/approximate-size-test`.

#### `._isBuffer` method removed

Because `Buffer` is available in all environments nowadays, there is no need for alternatives like typed arrays. It is preferred to use `Buffer` and `Buffer.isBuffer()` directly.

#### `isLevelDOWN` function removed

This was a legacy function.

#### `ranges-test.js` renamed

We have refactored a lot of the tests. Specifically the iterator tests were split in two and in that process we renamed `ranges-test.js` to `iterator-range-test.js`.

If your implementation is using these tests then change from:

```js
const abstract = require('abstract-leveldown/abstract/ranges-test')
```

to:

```js
const abstract = require('abstract-leveldown/abstract/iterator-range-test')
```

## v3

No changes to the API. New major version because support for node 0.12 was dropped.
