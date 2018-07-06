var collectEntries = require('level-concat-iterator')
var tempy = require('tempy')

module.exports = {
  location: tempy.directory,
  collectEntries: collectEntries,
  setUp: function (t) {
    t.end()
  },
  tearDown: function (t) {
    t.end()
  }
}
