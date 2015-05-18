module.exports.args = function (leveldown, test, testCommon) {
  test('test database creation, optional options', function (t) {
    var options = { foo: 'bar' }
    var db = leveldown(options)
    t.ok(db, 'database object returned')
    t.deepEqual(db.options, options)
    t.equal(typeof db.open, 'function', 'open() function exists')
    t.equal(leveldown().opts, undefined, 'undefined options')
    t.end()
  })
}
