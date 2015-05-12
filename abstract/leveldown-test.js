module.exports.args = function (leveldown, test) {
  test('test database creation no-arg throws', function (t) {
    t.throws(
        leveldown
      , /constructor requires at least a location argument/
      , 'no-arg leveldown() throws'
    )
    t.end()
  })

  test('test database creation non-string location throws', function (t) {
    t.throws(
        function () {
          leveldown({})
        }
      , /constructor requires a non empty location string/
      , 'non-string location leveldown() throws'
    )
    t.end()
  })

  test('test database creation empty string location throws', function (t) {
    t.throws(
        function () {
          leveldown('')
        }
      , /constructor requires a non empty location string/
      , 'non-string location leveldown() throws'
    )
    t.end()
  })

  test('test database creation non empty string does not throw', function (t) {
    var db
    t.doesNotThrow(function () { db = leveldown('foo') })
    t.ok(db, 'database object returned')
    t.ok(typeof db.open === 'function', 'open() function exists')
    t.end()
  })
}
