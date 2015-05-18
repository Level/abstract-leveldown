module.exports.args = function (leveldown, test, testCommon) {
  test('test database creation, optional options', function (t) {
    var opts = { foo: 'bar' }
    var db = leveldown(opts)
    t.ok(db, 'database object returned')
    t.deepEqual(db.opts, opts)
    t.equal(typeof db.open, 'function', 'open() function exists')
    t.equal(leveldown().opts, undefined, 'undefined options')
    t.end()
  })
}
