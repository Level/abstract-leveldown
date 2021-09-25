'use strict'

const nextTick = require('../next-tick')
const nfre = /NotFound/i

exports.verifyNotFoundError = function verifyNotFoundError (err) {
  return nfre.test(err.message) || nfre.test(err.name)
}

exports.isTypedArray = function isTypedArray (value) {
  return (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) ||
    (typeof Uint8Array !== 'undefined' && value instanceof Uint8Array)
}

exports.assertAsync = function (t, fn) {
  let called = false

  nextTick(function () {
    t.is(called, false, 'callback is asynchronous')
  })

  return function (...args) {
    called = true
    return fn(...args)
  }
}
