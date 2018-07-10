module.exports.args = function (factory, test) {
  test('test database open method exists', function (t) {
    var db = factory()
    t.ok(db, 'database object returned')
    t.ok(typeof db.open === 'function', 'open() function exists')
    t.end()
  })
}
