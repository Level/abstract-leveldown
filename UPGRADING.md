# Upgrade Guide

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

The `.approximateSize` method has been removed. The rationale behind this is that it's a feature heavily related to `LevelDB` and not necessarily something that's used in other stores. If your store has implemented `._approximateSize` it will never be called by `abstract-leveldown`.

If your implementation needs this, it must rename `._approximateSize` to `.approximateSize` and also take care of the initialization code, take a look at what `leveldown` has done if you need more details.

Also, the corresponding abstract tests have been removed, so your implementation can no longer require `abstract/approximate-size-test`.

#### `._isBuffer` method removed

Because `Buffer` is available in all environments nowadays, there is no need for alternatives like typed arrays. It is preferred to use `Buffer` and `Buffer.isBuffer()` directly.

#### `isLevelDOWN` function removed

This was a legacy function and no implementation seems to use it.

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
