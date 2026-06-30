const { Given, When, Then } = require('@cucumber/cucumber')
const {
  assert,
  authHeaders,
  createAuthenticatedUser,
  createProject,
  request,
} = require('../support/api')

Given(
  'existe un usuario autenticado con email {string}',
  async function (email) {
    this.currentUser = await createAuthenticatedUser(email)
  }
)

Given(
  'que existe un proyecto {string} del usuario {string}',
  async function (projectName, ownerEmail) {
    let owner = this.currentUser

    if (!owner || owner.email !== ownerEmail) {
      owner = await createAuthenticatedUser(ownerEmail)
    }

    const response = await createProject(owner.token, {
      name: projectName,
      description: 'Proyecto de setup',
    })

    assert.equal(response.status, 201)
    this.currentProject = response.data
  }
)

Given(
  'que existe un proyecto {string} de otro usuario {string}',
  async function (projectName, ownerEmail) {
    const owner = await createAuthenticatedUser(ownerEmail)
    const response = await createProject(owner.token, {
      name: projectName,
      description: 'Proyecto privado',
    })

    assert.equal(response.status, 201)
  }
)

When('el usuario crea un proyecto con:', async function (dataTable) {
  const data = dataTable.rowsHash()
  this.response = await createProject(this.currentUser.token, {
    name: data.name,
    description: data.description,
  })
})

When(
  'el usuario crea un proyecto sin autenticacion con:',
  async function (dataTable) {
    const data = dataTable.rowsHash()
    this.response = await request('/api/projects', {
      method: 'POST',
      body: {
        name: data.name,
        description: data.description,
      },
    })
  }
)

When('el usuario consulta sus proyectos', async function () {
  this.response = await request('/api/projects', {
    headers: authHeaders(this.currentUser.token),
  })
})

Then('el listado incluye el proyecto {string}', function (projectName) {
  assert.ok(Array.isArray(this.response.data))
  assert.ok(this.response.data.some((project) => project.name === projectName))
})

Then('el listado no incluye el proyecto {string}', function (projectName) {
  assert.ok(Array.isArray(this.response.data))
  assert.ok(
    this.response.data.every((project) => project.name !== projectName),
    `El listado no deberia incluir ${projectName}`
  )
})
