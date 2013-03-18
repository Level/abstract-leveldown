/* Copyright (c) 2013 Rod Vagg, MIT License */

function checkKeyValue (obj, type) {
  if (obj === null || obj === undefined)
    return new Error(type + ' cannot be `null` or `undefined`')
  if (obj === null || obj === undefined)
    return new Error(type + ' cannot be `null` or `undefined`')
  if (Buffer.isBuffer(obj)) {
    if (obj.length === 0)
      return new Error(type + ' cannot be an empty Buffer')
  } else if (String(obj) === '')
    return new Error(type + ' cannot be an empty String')
}

function AbstractIterator (db) {
  this.db = db
  this._ended = false
  this._nexting = false
}

AbstractIterator.prototype.next = function (callback) {
  if (typeof callback != 'function')
    throw new Error('next() requires a callback argument')

  if (this._ended)
    throw new Error('cannot call next() after end()')
  if (this._nexting)
    throw new Error('cannot call next() before previous next() has completed')

  this._nexting = true
  if (typeof this._next == 'function') {
    return this._next(function () {
      this._nexting = false
      callback.apply(null, arguments)
    }.bind(this))
  }

  process.nextTick(function () {
    this._nexting = false
    callback()
  }.bind(this))
}

AbstractIterator.prototype.end = function (callback) {
  if (typeof callback != 'function')
    throw new Error('end() requires a callback argument')

  if (this._ended)
    throw new Error('end() already called on iterator')

  this._ended = true

  if (typeof this._end == 'function')
    return this._end(callback)

  process.nextTick(callback)
}

function AbstractLevelDOWN (location) {
  if (!arguments.length || location === undefined)
    throw new Error('leveldown() requires at least a location argument')

  if (typeof location != 'string')
    throw new Error('leveldown() requires a location string argument')

  this.location = location
}

AbstractLevelDOWN.prototype.open = function (options, callback) {
  if (typeof options == 'function')
    callback = options
  if (typeof callback != 'function')
    throw new Error('open() requires a callback argument')
  if (typeof options != 'object')
    options = {}

  if (typeof this._open == 'function')
    return this._open(options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.close = function (callback) {
  if (typeof callback != 'function')
    throw new Error('close() requires a callback argument')

  if (typeof this._close == 'function')
    return this._close(callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.get = function (key, options, callback) {
  if (typeof options == 'function')
    callback = options
  if (typeof callback != 'function')
    throw new Error('get() requires a callback argument')
  var err = checkKeyValue(key, 'key')
  if (err) return callback(err)
  if (!Buffer.isBuffer(key)) key = String(key)
  if (typeof options != 'object')
    options = {}

  if (typeof this._get == 'function')
    return this._get(key, options, callback)

  process.nextTick(callback.bind(null, new Error('NotFound')))
}

AbstractLevelDOWN.prototype.put = function (key, value, options, callback) {
  if (typeof options == 'function')
    callback = options
  if (typeof callback != 'function')
    throw new Error('put() requires a callback argument')
  var err = checkKeyValue(value, 'value')
  if (err) return callback(err)
  err = checkKeyValue(key, 'key')
  if (err) return callback(err)
  if (!Buffer.isBuffer(key)) key = String(key)
  if (!Buffer.isBuffer(value)) value = String(value)
  if (typeof options != 'object')
    options = {}

  if (typeof this._put == 'function')
    return this._put(key, value, options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.del = function (key, options, callback) {
  if (typeof options == 'function')
    callback = options
  if (typeof callback != 'function')
    throw new Error('del() requires a callback argument')
  var err = checkKeyValue(key, 'key')
  if (err) return callback(err)
  if (!Buffer.isBuffer(key)) key = String(key)
  if (typeof options != 'object')
    options = {}


  if (typeof this._del == 'function')
    return this._del(key, options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.batch = function (array, options, callback) {
  if (typeof options == 'function')
    callback = options
  if (!Array.isArray(array) && typeof array == 'object') {
    options = array
    array = undefined
  }
  if (typeof options != 'object')
    options = {}

  // TODO: if array == undefined && callback == function, derp

  if (typeof this._batch == 'function')
    return this._batch(array, options, callback)

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.approximateSize = function (start, end, callback) {
  if (start == null || end == null || typeof start == 'function' || typeof end == 'function')
    throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments')
  if (typeof callback != 'function')
    throw new Error('approximateSize() requires a callback argument')

  if (!Buffer.isBuffer(start)) start = String(start)
  if (!Buffer.isBuffer(end)) end = String(end)
  if (typeof this._approximateSize == 'function')
    return this._approximateSize(start, end, callback)

  process.nextTick(callback.bind(null, null, 0))
}

AbstractLevelDOWN.prototype.iterator = function (options) {
  if (typeof options != 'object')
    options = {}

  if (typeof this._iterator == 'function')
    return this._iterator(options)

  return new AbstractIterator(this)
}

module.exports.AbstractLevelDOWN = AbstractLevelDOWN
module.exports.AbstractIterator  = AbstractIterator
module.exports.checkKeyValue     = checkKeyValue