var collectEntries = require('level-concat-iterator')
var tempy = require('tempy')

module.exports = {
  // TODO remove?
  location: tempy.directory,
  // Remove and use level-concat-iterator explicitly where applicable?
  collectEntries: collectEntries,
  setUp: function (t) {
    t.end()
  },
  tearDown: function (t) {
    t.end()
  }
}
