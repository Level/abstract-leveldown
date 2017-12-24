/* Copyright (c) 2017 Rod Vagg, MIT License */

var xtend = require('xtend')
var AbstractIterator = require('./abstract-iterator')
var AbstractChainedBatch = require('./abstract-chained-batch')

function AbstractLevelDOWN (location) {
  if (!arguments.length || location === undefined) {
    throw new Error('constructor requires at least a location argument')
  }

  if (typeof location !== 'string') {
    throw new Error('constructor requires a location string argument')
  }

  this.location = location
  this.status = 'new'
}

AbstractLevelDOWN.prototype.open = function (options, callback) {
  var self = this
  var oldStatus = this.status

  if (typeof options === 'function') { callback = options }

  if (typeof callback !== 'function') {
    throw new Error('open() requires a callback argument')
  }

  if (typeof options !== 'object') { options = {} }

  options.createIfMissing = options.createIfMissing !== false
  options.errorIfExists = !!options.errorIfExists

  if (typeof this._open === 'function') {
    this.status = 'opening'
    this._open(options, function (err) {
      if (err) {
        self.status = oldStatus
        return callback(err)
      }
      self.status = 'open'
      callback()
    })
  } else {
    this.status = 'open'
    process.nextTick(callback)
  }
}

AbstractLevelDOWN.prototype.close = function (callback) {
  var self = this
  var oldStatus = this.status

  if (typeof callback !== 'function') {
    throw new Error('close() requires a callback argument')
  }

  if (typeof this._close === 'function') {
    this.status = 'closing'
    this._close(function (err) {
      if (err) {
        self.status = oldStatus
        return callback(err)
      }
      self.status = 'closed'
      callback()
    })
  } else {
    this.status = 'closed'
    process.nextTick(callback)
  }
}

AbstractLevelDOWN.prototype.get = function (key, options, callback) {
  if (typeof options === 'function') { callback = options }

  if (typeof callback !== 'function') {
    throw new Error('get() requires a callback argument')
  }

  var err = this._checkKey(key, 'key')
  if (err) return process.nextTick(callback, err)

  key = this._serializeKey(key)

  if (typeof options !== 'object') { options = {} }

  options.asBuffer = options.asBuffer !== false

  if (typeof this._get === 'function') {
    return this._get(key, options, callback)
  }

  process.nextTick(function () { callback(new Error('NotFound')) })
}

AbstractLevelDOWN.prototype.put = function (key, value, options, callback) {
  if (typeof options === 'function') { callback = options }

  if (typeof callback !== 'function') {
    throw new Error('put() requires a callback argument')
  }

  var err = this._checkKey(key, 'key')
  if (err) return process.nextTick(callback, err)

  key = this._serializeKey(key)
  value = this._serializeValue(value)

  if (typeof options !== 'object') { options = {} }

  if (typeof this._put === 'function') {
    return this._put(key, value, options, callback)
  }

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.del = function (key, options, callback) {
  if (typeof options === 'function') { callback = options }

  if (typeof callback !== 'function') {
    throw new Error('del() requires a callback argument')
  }

  var err = this._checkKey(key, 'key')
  if (err) return process.nextTick(callback, err)

  key = this._serializeKey(key)

  if (typeof options !== 'object') { options = {} }

  if (typeof this._del === 'function') {
    return this._del(key, options, callback)
  }

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype.batch = function (array, options, callback) {
  if (!arguments.length) { return this._chainedBatch() }

  if (typeof options === 'function') { callback = options }

  if (typeof array === 'function') { callback = array }

  if (typeof callback !== 'function') {
    throw new Error('batch(array) requires a callback argument')
  }

  if (!Array.isArray(array)) {
    return process.nextTick(callback, new Error('batch(array) requires an array argument'))
  }

  if (!options || typeof options !== 'object') { options = {} }

  var serialized = new Array(array.length)

  for (var i = 0; i < array.length; i++) {
    if (typeof array[i] !== 'object' || array[i] === null) {
      return process.nextTick(callback, new Error('batch(array) element must be an object and not `null`'))
    }

    var e = xtend(array[i])

    if (e.type !== 'put' && e.type !== 'del') {
      return process.nextTick(callback, new Error("`type` must be 'put' or 'del'"))
    }

    var err = this._checkKey(e.key, 'key')
    if (err) return process.nextTick(callback, err)

    e.key = this._serializeKey(e.key)

    if (e.type === 'put') { e.value = this._serializeValue(e.value) }

    serialized[i] = e
  }

  if (typeof this._batch === 'function') {
    return this._batch(serialized, options, callback)
  }

  process.nextTick(callback)
}

AbstractLevelDOWN.prototype._setupIteratorOptions = function (options) {
  options = xtend(options)

  function shouldDeleteOption (o) {
    if (Buffer.isBuffer(o) && o.length === 0) return true
    if (typeof o === 'string' && o.length === 0) return true
    if (o === null) return true
  }

  ;[ 'start', 'end', 'gt', 'gte', 'lt', 'lte' ].forEach(function (o) {
    if (shouldDeleteOption(options[o])) {
      delete options[o]
    }
  })

  options.reverse = !!options.reverse
  options.keys = options.keys !== false
  options.values = options.values !== false
  options.limit = 'limit' in options ? options.limit : -1
  options.keyAsBuffer = options.keyAsBuffer !== false
  options.valueAsBuffer = options.valueAsBuffer !== false

  return options
}

AbstractLevelDOWN.prototype.iterator = function (options) {
  if (typeof options !== 'object') { options = {} }

  options = this._setupIteratorOptions(options)

  if (typeof this._iterator === 'function') { return this._iterator(options) }

  return new AbstractIterator(this)
}

AbstractLevelDOWN.prototype._chainedBatch = function () {
  return new AbstractChainedBatch(this)
}

AbstractLevelDOWN.prototype._serializeKey = function (key) {
  return Buffer.isBuffer(key) ? key : String(key)
}

AbstractLevelDOWN.prototype._serializeValue = function (value) {
  if (value == null) return ''
  return Buffer.isBuffer(value) || process.browser ? value : String(value)
}

AbstractLevelDOWN.prototype._checkKey = function (obj, type) {
  if (obj === null || obj === undefined) {
    return new Error(type + ' cannot be `null` or `undefined`')
  }

  if (Buffer.isBuffer(obj) && obj.length === 0) {
    return new Error(type + ' cannot be an empty Buffer')
  }

  if (String(obj) === '') {
    return new Error(type + ' cannot be an empty String')
  }
}

module.exports = AbstractLevelDOWN
