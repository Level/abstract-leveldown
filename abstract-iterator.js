/* Copyright (c) 2013 Rod Vagg, MIT License */

function AbstractIterator (db) {
  this.db = db
  this._ended = false
  this._nexting = false
}

AbstractIterator.prototype.next = function (callback) {
  if (typeof callback != 'function')
    throw new Error('next() requires a callback argument')

  if (this._ended) {
    callback(new Error('cannot call next() after end()'))
    return;
  }
  if (this._nexting) {
    callback(new Error('cannot call next() before previous next() has completed'))
    return;
  }

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

module.exports = AbstractIterator
