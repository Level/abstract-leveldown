var path = require('path')
var collectEntries = require('level-concat-iterator')

var dbidx = 0

var location = function () {
  return path.join(__dirname, '_leveldown_test_db_' + dbidx++)
}

var setUp = function (t) {
  t.end()
}

var tearDown = function (t) {
  t.end()
}

module.exports = {
  location: location,
  setUp: setUp,
  tearDown: tearDown,
  collectEntries: collectEntries
}
