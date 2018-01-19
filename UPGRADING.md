# Upgrade Guide

## v4

#### `testCommon` parameter defaults

The `testCommon` variable will now default to `testCommon.js` in `abstract-leveldown`. Unless your implementation needs a modified version, you can just omit the parameter.

For instance, `leveldown` requires `testCommon.js` directly from `abstract-leveldown` and passes it in as a parameter, which makes for unnecessary boiler plate.

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

The `abstract/put-get-del-test.js` previously took a custom `testBuffer` parameter, which now has been removed. After an [analysis](https://github.com/Level/abstract-leveldown/pull/175#issuecomment-353867144) of different implementations we came to the conclusion that no implementation really needed this parameter. They basically just passed in a `Buffer` with a custom value which is more unnecessary boiler plate.

If your implementation are using this abstract test, change from:

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

The `.approximateSize` method has been removed. The rationale behind this is that it's a feature heavily related to `LevelDB` and not necessarily something that's used in other stores. If your store has implemented `._approximateSize` it will never be called by `abstract-leveldown`.

If your implementation needs this, it must rename `._approximateSize` to `.approximateSize` and also take care of the initialization code, take a look at what `leveldown` has done if you need more details.

Also, the corresponding abstract tests have been removed, so your implementation can no longer require `abstract/approximate-size-test`.

#### `._isBuffer` method removed

If you rely on this use `Buffer.isBuffer()` instead.

#### `isLevelDOWN` function removed

This was a legacy function and no implementation seems to use it.

#### `ranges-test.js` renamed

We have refactored a lot of the tests, specifically the iterator tests were split into two tests and in that process we renamed `ranges-test.js` to `iterator-range-test.js`.

If your implementation are using these tests then change from:

```js
const abstract = require('abstract-leveldown/abstract/ranges-test')
```

to:

```js
const abstract = require('abstract-leveldown/abstract/iterator-range-test')
```

## v3

No changes to the API. New major version because support for node 0.12 was dropped.
