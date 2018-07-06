var collectEntries = require('level-concat-iterator')
var tempy = require('tempy')

var location = function () {
  return tempy.directory()
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
