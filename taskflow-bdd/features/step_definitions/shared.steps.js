const { Then } = require('@cucumber/cucumber')
const { assert } = require('../support/api')

Then('la respuesta tiene codigo de estado {int}', function (expectedStatus) {
  assert.ok(
    this.response,
    'No se encontro respuesta en el contexto del escenario'
  )
  assert.equal(this.response.status, expectedStatus)
})

Then('el cuerpo contiene el campo {string}', function (field) {
  assert.ok(this.response.data)
  assert.ok(
    Object.prototype.hasOwnProperty.call(this.response.data, field),
    `No se encontro el campo ${field} en la respuesta`
  )
})

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  assert.ok(this.response.data)
  assert.equal(String(this.response.data[field]), value)
})
