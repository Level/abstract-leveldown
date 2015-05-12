module.exports.close = function (leveldown, test, testCommon) {
  test('test close()', function (t) {
    var db = leveldown(testCommon.location())

    db.open(function (err) {
      t.error(err)
      t.throws(
          db.close.bind(db, 'foo')
        , { name: 'Error', message: 'close() requires callback function argument' }
        , 'non-callback close() throws'
      )

      db.close(function (err) {
        t.error(err)
        t.end()
      })
    })
  })
}
