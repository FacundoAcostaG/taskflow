const { Given, When } = require('@cucumber/cucumber')
const {
  assert,
  loginUser,
  registerUser,
  request,
  resetData,
} = require('../support/api')

Given('el servidor de TaskFlow esta disponible', async function () {
  const response = await request('/health')
  assert.equal(response.status, 200)
})

Given('la base de datos esta limpia', async function () {
  const response = await resetData()
  assert.equal(response.status, 200)
})

Given('que el email {string} no esta registrado', async function (email) {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'Setup123!' },
  })

  assert.notEqual(
    response.status,
    200,
    `El email ${email} ya estaba disponible para login`
  )
})

Given('que el email {string} ya esta registrado', async function (email) {
  const response = await registerUser(email)
  assert.equal(response.status, 201)
})

Given('que ningun usuario esta registrado', async function () {
  const response = await resetData()
  assert.equal(response.status, 200)
})

Given(
  'que existe el usuario con email {string} y password {string}',
  async function (email, password) {
    const response = await registerUser(email, { password, name: 'Test User' })
    assert.equal(response.status, 201)
  }
)

Given('el usuario no esta autenticado', function () {
  this.currentUser = null
})

When('el usuario envia los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash()
  this.response = await registerUser(data.email, {
    password: data.password,
    name: data.name,
  })
})

When('el usuario envia las credenciales:', async function (dataTable) {
  const data = dataTable.rowsHash()
  this.response = await loginUser(data.email, data.password)
})
