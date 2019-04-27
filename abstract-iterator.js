function AbstractIterator (db) {
  if (typeof db !== 'object' || db === null) {
    throw new TypeError('First argument must be an abstract-leveldown compliant store')
  }

  this.db = db
  this._ended = false
  this._nexting = false
}

AbstractIterator.prototype.next = function (callback) {
  // In callback mode, we return `this`
  var ret = this
  var self = this

  if (callback === undefined) {
    ret = new Promise(function (resolve, reject) {
      callback = function (err, key, value) {
        if (err) reject(err)
        else if (key === undefined && value === undefined) resolve()
        else resolve([key, value])
      }
    })
  } else if (typeof callback !== 'function') {
    throw new Error('next() requires a callback argument')
  }

  if (self._ended) {
    process.nextTick(callback, new Error('cannot call next() after end()'))
    return ret
  }

  if (self._nexting) {
    process.nextTick(callback, new Error('cannot call next() before previous next() has completed'))
    return ret
  }

  self._nexting = true
  self._next(function () {
    self._nexting = false
    callback.apply(null, arguments)
  })

  return ret
}

AbstractIterator.prototype._next = function (callback) {
  process.nextTick(callback)
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
  if (callback === undefined) {
    var promise = new Promise(function (resolve, reject) {
      callback = function (err) {
        if (err) reject(err)
        else resolve()
      }
    })
  } else if (typeof callback !== 'function') {
    throw new Error('end() requires a callback argument')
  }

  if (this._ended) {
    process.nextTick(callback, new Error('end() already called on iterator'))
    return promise
  }

  this._ended = true
  this._end(callback)

  return promise
}

AbstractIterator.prototype._end = function (callback) {
  process.nextTick(callback)
}

AbstractIterator.prototype[Symbol.asyncIterator] = async function * () {
  try {
    var kv

    while ((kv = await this.next()) !== undefined) {
      yield kv
    }
  } finally {
    await this.end()
  }
}

module.exports = AbstractIterator
