'use strict'

const AbstractIterator = require('../abstract-iterator')

const kOptions = Symbol('options')
const kNut = Symbol('nut')
const kUndefer = Symbol('undefer')

class DeferredIterator extends AbstractIterator {
  constructor (db, options) {
    super(db)

    this[kOptions] = options
    this[kNut] = null

    this.defer(kUndefer, [])
  }

  [kUndefer] () {
    // TODO: test that both are detached and closed on db.close()
    this[kNut] = this.db.iterator(this[kOptions])
  }

  _next (callback) {
    if (this[kNut] !== null) {
      this[kNut].next(callback)
    } else if (this.db.status === 'opening') {
      this.defer('_next', [callback], { callback })
    } else {
      /* istanbul ignore next: assertion */
      throw new Error('Invalid state')
    }
  }

  _seek (target) {
    this[kNut].seek(target)
  }

  _close (callback) {
    if (this[kNut] !== null) {
      this[kNut].close(callback)
    } else if (this.db.status === 'opening') {
      this.defer('_close', [callback], { callback })
    } else {
      this.nextTick(callback)
    }
  }
}

module.exports = DeferredIterator
