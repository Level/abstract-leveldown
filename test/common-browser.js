var collectEntries = require('level-concat-iterator')

module.exports = {
  location: function () {
    return ''
  },
  collectEntries: collectEntries,
  setUp: function (t) {
    t.end()
  },
  tearDown: function (t) {
    t.end()
  }
}
