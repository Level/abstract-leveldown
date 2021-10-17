'use strict'

const kDb = Symbol('db')
const kMethod = Symbol('method')
const kArgs = Symbol('args')
const kCallback = Symbol('callback')
const kThisArg = Symbol('thisArg')

module.exports = class DeferredOperation {
  constructor (db, method, args, options) {
    if (typeof method !== 'string' && typeof method !== 'symbol') {
      throw new TypeError('The first argument must be a string or symbol')
    }

    if (!Array.isArray(args)) {
      throw new TypeError('The second argument must be an array')
    }

    this[kDb] = db
    this[kMethod] = method
    this[kArgs] = args

    if (typeof options !== 'object' && options != null) {
      throw new TypeError('The third argument must be null, undefined or an object')
    }

    this[kThisArg] = options && options.thisArg != null ? options.thisArg : this[kDb]
    this[kCallback] = options && options.callback != null ? options.callback : null

    if (typeof this[kThisArg] !== 'object') {
      throw new TypeError('The \'thisArg\' option must be an object')
    }

    if (typeof this[kCallback] !== 'function' && this[kCallback] !== null) {
      throw new TypeError('The \'callback\' option must be a function')
    }
  }

  undefer () {
    if (this[kDb].status !== 'open') {
      const callback = this[kCallback]

      if (callback) {
        callback(new Error('Database is not open'))
      }
    } else {
      this[kThisArg][this[kMethod]](...this[kArgs])
    }
  }
}
