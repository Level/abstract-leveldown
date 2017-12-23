var AbstractLevelDOWN = require('./abstract-leveldown')

function isLevelDOWN (db) {
  if (!db || typeof db !== 'object') { return false }
  return Object.keys(AbstractLevelDOWN.prototype).filter(function (name) {
    return name[0] !== '_'
  }).every(function (name) {
    return typeof db[name] === 'function'
  })
}

module.exports = isLevelDOWN
