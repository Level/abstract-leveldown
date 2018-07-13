exports.args = function (test, testCommon) {
  test('test database open method exists', function (t) {
    var db = testCommon.factory()
    t.ok(db, 'database object returned')
    t.ok(typeof db.open === 'function', 'open() function exists')
    t.end()
  })
}
