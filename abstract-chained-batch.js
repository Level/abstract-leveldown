'use strict'

const { fromCallback } = require('catering')
const { getCallback, getOptions } = require('./lib/common')

const emptyOptions = Object.freeze({})
const kPromise = Symbol('promise')
const kStatus = Symbol('status')
const kDefault = Symbol('default')
const kOperations = Symbol('operations')
const kFinishClose = Symbol('finishClose')
const kCloseCallbacks = Symbol('closeCallbacks')

// TODO: consider splitting a "DefaultChainedBatch" class from AbstractChainedBatch
function AbstractChainedBatch (db) {
  if (typeof db !== 'object' || db === null) {
    throw new TypeError('First argument must be an abstract-leveldown compliant store')
  }

  this[kDefault] = this.constructor === AbstractChainedBatch
  this[kOperations] = []
  this[kCloseCallbacks] = []
  this[kStatus] = 'open'
  this[kFinishClose] = this[kFinishClose].bind(this)

  this.db = db
  this.db.attachResource(this)
}

Object.defineProperty(AbstractChainedBatch.prototype, 'length', {
  // Allow implementations to implement it differently if needed
  configurable: true,
  enumerable: true,
  get () {
    return this[kOperations].length
  }
})

AbstractChainedBatch.prototype.put = function (key, value, options) {
  if (this[kStatus] !== 'open') {
    throw new Error('Batch is not open')
  }

  // TODO: can also be skipped if default. Update tests
  const err = this.db._checkKey(key) || this.db._checkValue(value)
  if (err) throw err

  if (!this[kDefault]) {
    const skey = this.db._serializeKey(key)
    const svalue = this.db._serializeValue(value)

    this._put(skey, svalue, options != null ? options : emptyOptions)
  }

  this[kOperations].push({ ...options, type: 'put', key, value })
  return this
}

AbstractChainedBatch.prototype._put = function (key, value, options) {}

AbstractChainedBatch.prototype.del = function (key, options) {
  if (this[kStatus] !== 'open') {
    throw new Error('Batch is not open')
  }

  // TODO: can also be skipped if default. Update tests
  const err = this.db._checkKey(key)
  if (err) throw err

  if (!this[kDefault]) {
    this._del(this.db._serializeKey(key), options != null ? options : emptyOptions)
  }

  this[kOperations].push({ ...options, type: 'del', key })
  return this
}

AbstractChainedBatch.prototype._del = function (key, options) {}

AbstractChainedBatch.prototype.clear = function () {
  if (this[kStatus] !== 'open') {
    throw new Error('Batch is not open')
  }

  this._clear()
  this[kOperations] = []

  return this
}

AbstractChainedBatch.prototype._clear = function () {}

AbstractChainedBatch.prototype.write = function (options, callback) {
  callback = getCallback(options, callback)
  callback = fromCallback(callback, kPromise)
  options = getOptions(options)

  if (this[kStatus] !== 'open') {
    this._nextTick(callback, new Error('Batch is not open'))
  } else {
    this[kStatus] = 'writing'
    this._write(options, (err) => {
      this[kStatus] = 'closing'

      // TODO: yielding a close error to the write() callback suggests the batch failed
      this[kCloseCallbacks].push((err2) => callback(err || err2))

      // Emit after setting 'closing' status, because event may trigger a
      // db close which in turn triggers (idempotently) closing this batch.
      if (!err) this.db.emit('batch', this[kOperations])

      // Avoid an extra tick for backwards compatibility with < 8.0.0
      if (this._close === defaultClose) {
        this[kFinishClose]()
      } else {
        this._close(this[kFinishClose])
      }
    })
  }

  return callback[kPromise]
}

AbstractChainedBatch.prototype._write = function (options, callback) {
  // Assumes this[kOperations] cannot change after write()
  // TODO: make silent an internal option or solve this (the double event) differently
  this.db.batch(this[kOperations], { ...options, silent: true }, callback)
}

// TODO: docs
AbstractChainedBatch.prototype.close = function (callback) {
  callback = fromCallback(callback, kPromise)

  if (this[kStatus] === 'closing') {
    this[kCloseCallbacks].push(callback)
  } else if (this[kStatus] === 'closed') {
    this._nextTick(callback)
  } else {
    this[kCloseCallbacks].push(callback)

    if (this[kStatus] !== 'writing') {
      this[kStatus] = 'closing'
      this._close(this[kFinishClose])
    }
  }

  return callback[kPromise]
}

// TODO: document that e.g. leveldown should cleanup
AbstractChainedBatch.prototype._close = defaultClose

function defaultClose (callback) {
  this._nextTick(callback)
}

AbstractChainedBatch.prototype[kFinishClose] = function (err) {
  this[kStatus] = 'closed'
  this.db.detachResource(this)

  const callbacks = this[kCloseCallbacks]
  this[kCloseCallbacks] = []

  for (const cb of callbacks) {
    cb(err)
  }
}

AbstractChainedBatch.prototype.defer = function (method, args, options) {
  this.db.defer(method, args, { thisArg: this, ...options })
}

// Expose browser-compatible nextTick for dependents
AbstractChainedBatch.prototype.nextTick =
AbstractChainedBatch.prototype._nextTick = require('./next-tick')

module.exports = AbstractChainedBatch
