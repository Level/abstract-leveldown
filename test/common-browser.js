var collectEntries = require('level-concat-iterator')

module.exports = {
  // TODO remove?
  location: function () {
    return ''
  },
  // Remove and use level-concat-iterator explicitly where applicable?
  collectEntries: collectEntries,
  setUp: function (t) {
    t.end()
  },
  tearDown: function (t) {
    t.end()
  }
}
