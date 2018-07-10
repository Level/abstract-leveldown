module.exports.args = function (leveldown, test) {
  test('test database open no-arg throws', function (t) {
    var db = leveldown('foo')
    t.ok(db, 'database object returned')
    t.ok(typeof db.open === 'function', 'open() function exists')
    t.end()
  })
}
