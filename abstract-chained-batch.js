'use strict'

const { fromCallback } = require('catering')
const { getCallback, getOptions } = require('./lib/common')

const emptyOptions = Object.freeze({})
const kLength = Symbol('length')
const kPromise = Symbol('promise')

function AbstractChainedBatch (db) {
  if (typeof db !== 'object' || db === null) {
    throw new TypeError('First argument must be an abstract-leveldown compliant store')
  }

  this.db = db
  this._operations = []
  this._written = false
  this[kLength] = 0
}

Object.defineProperty(AbstractChainedBatch.prototype, 'length', {
  // Allow implementations to implement it differently if needed
  configurable: true,
  enumerable: true,
  get () {
    return this[kLength]
  }
})

AbstractChainedBatch.prototype._checkWritten = function () {
  if (this._written) {
    throw new Error('write() already called on this batch')
  }
}

AbstractChainedBatch.prototype.put = function (key, value, options) {
  if (!this.db.isOperational()) {
    throw new Error('Database is not open')
  }

  this._checkWritten()

  const err = this.db._checkKey(key) || this.db._checkValue(value)
  if (err) throw err

  key = this.db._serializeKey(key)
  value = this.db._serializeValue(value)

  this._put(key, value, options != null ? options : emptyOptions)
  this[kLength]++

  return this
}

AbstractChainedBatch.prototype._put = function (key, value, options) {
  this._operations.push({ ...options, type: 'put', key, value })
}

AbstractChainedBatch.prototype.del = function (key, options) {
  if (!this.db.isOperational()) {
    throw new Error('Database is not open')
  }

  this._checkWritten()

  const err = this.db._checkKey(key)
  if (err) throw err

  key = this.db._serializeKey(key)
  this._del(key, options != null ? options : emptyOptions)
  this[kLength]++

  return this
}

AbstractChainedBatch.prototype._del = function (key, options) {
  this._operations.push({ ...options, type: 'del', key })
}

AbstractChainedBatch.prototype.clear = function () {
  if (!this.db.isOperational()) {
    throw new Error('Database is not open')
  }

  this._checkWritten()
  this._clear()
  this[kLength] = 0

  return this
}

AbstractChainedBatch.prototype._clear = function () {
  this._operations = []
}

AbstractChainedBatch.prototype.write = function (options, callback) {
  callback = getCallback(options, callback)
  callback = fromCallback(callback, kPromise)
  options = getOptions(options)

  if (!this.db.isOperational()) {
    this._nextTick(callback, new Error('Database is not open'))
    return callback[kPromise]
  }

  this._checkWritten()
  this._written = true
  this._write(options, callback)

  return callback[kPromise]
}

AbstractChainedBatch.prototype._write = function (options, callback) {
  this.db._batch(this._operations, options, callback)
}

// Expose browser-compatible nextTick for dependents
AbstractChainedBatch.prototype._nextTick = require('./next-tick')

module.exports = AbstractChainedBatch
