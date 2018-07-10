var tempy = require('tempy')

module.exports = {
  // TODO remove?
  location: tempy.directory,
  setUp: function (t) {
    t.end()
  },
  tearDown: function (t) {
    t.end()
  }
}
