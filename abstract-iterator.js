'use strict'

const nextTick = require('./next-tick')

function AbstractIterator (db) {
  if (typeof db !== 'object' || db === null) {
    throw new TypeError('First argument must be an abstract-leveldown compliant store')
  }

  this.db = db
  this._ended = false
  this._nexting = false
}

AbstractIterator.prototype.next = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('next() requires a callback argument')
  }

  if (this._ended) {
    nextTick(callback, new Error('cannot call next() after end()'))
    return this
  }

  if (this._nexting) {
    nextTick(callback, new Error('cannot call next() before previous next() has completed'))
    return this
  }

  this._nexting = true
  this._next((err, ...rest) => {
    this._nexting = false
    callback(err, ...rest)
  })

  return this
}

AbstractIterator.prototype._next = function (callback) {
  nextTick(callback)
}

AbstractIterator.prototype.seek = function (target) {
  if (this._ended) {
    throw new Error('cannot call seek() after end()')
  }
  if (this._nexting) {
    throw new Error('cannot call seek() before next() has completed')
  }

  target = this.db._serializeKey(target)
  this._seek(target)
}

AbstractIterator.prototype._seek = function (target) {}

AbstractIterator.prototype.end = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('end() requires a callback argument')
  }

  if (this._ended) {
    return nextTick(callback, new Error('end() already called on iterator'))
  }

  this._ended = true
  this._end(callback)
}

AbstractIterator.prototype._end = function (callback) {
  nextTick(callback)
}

// Expose browser-compatible nextTick for dependents
AbstractIterator.prototype._nextTick = nextTick

module.exports = AbstractIterator
