'use strict'

// This file is excluded from the abstract test suite atm

const test = require('tape')
const AbstractLevelDOWN = require('..').AbstractLevelDOWN
const AbstractIterator = require('..').AbstractIterator

class MockDown extends AbstractLevelDOWN {
  _iterator (options) {
    return new MockIterator(this, options)
  }
}

class MockIterator extends AbstractIterator {
  constructor (db, options) {
    super(db)
    this.input = options.input.slice()
  }

  _next (callback) {
    process.nextTick(callback, null, this.input.shift(), this.input.shift())
  }
}

test('for await...of db.iterator()', async function (t) {
  t.plan(2)

  const db = new MockDown()
  const input = ['key1', 'value1', 'key2', 'value2']
  const output = []
  const it = db.iterator({ input })

  for await (let [key, value] of it) {
    output.push(key, value)
  }

  t.ok(it._ended, 'ended')
  t.same(output, input)
})

test('for await...of db.iterator() ends on user error', async function (t) {
  t.plan(2)

  const db = new MockDown()
  const input = ['key1', 'value1']
  const it = db.iterator({ input })

  try {
    // eslint-disable-next-line no-unused-vars
    for await (let kv of it) {
      throw new Error('user error')
    }
  } catch (err) {
    t.is(err.message, 'user error')
    t.ok(it._ended, 'ended')
  }
})

test('for await...of db.iterator() ends on iterator error', async function (t) {
  t.plan(2)

  const db = new MockDown()
  const input = ['key1', 'value1']
  const it = db.iterator({ input })

  it._next = function (callback) {
    process.nextTick(callback, new Error('iterator error'))
  }

  try {
    // eslint-disable-next-line no-unused-vars
    for await (let kv of it) {}
  } catch (err) {
    t.is(err.message, 'iterator error')
    t.ok(it._ended, 'ended')
  }
})
