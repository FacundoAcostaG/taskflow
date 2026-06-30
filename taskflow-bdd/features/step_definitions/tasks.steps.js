const { Given, When, Then } = require('@cucumber/cucumber')
const {
  assert,
  createAuthenticatedUser,
  createProject,
  createTask,
  request,
  updateTask,
} = require('../support/api')

Given(
  'existe un proyecto {string} con un miembro autenticado',
  async function (projectName) {
    this.currentUser = await createAuthenticatedUser('member@test.com')

    const projectResponse = await createProject(this.currentUser.token, {
      name: projectName,
      description: 'Proyecto para tareas',
    })

    assert.equal(projectResponse.status, 201)
    this.currentProject = projectResponse.data
  }
)

Given(
  'que existe la tarea {string} en estado TODO',
  async function (taskTitle) {
    const taskResponse = await createTask(
      this.currentProject.id,
      this.currentUser.token,
      {
        title: taskTitle,
        priority: 'MEDIUM',
      }
    )

    assert.equal(taskResponse.status, 201)
    this.currentTask = taskResponse.data
  }
)

When('el miembro crea una tarea con:', async function (dataTable) {
  const data = dataTable.rowsHash()
  this.response = await createTask(
    this.currentProject.id,
    this.currentUser.token,
    {
      title: data.title,
      priority: data.priority,
    }
  )
})

When(
  'el miembro crea una tarea sin autenticacion con:',
  async function (dataTable) {
    const data = dataTable.rowsHash()
    this.response = await request(
      `/api/projects/${this.currentProject.id}/tasks`,
      {
        method: 'POST',
        body: {
          title: data.title,
          priority: data.priority,
        },
      }
    )
  }
)

When('el miembro mueve la tarea al estado {string}', async function (status) {
  this.response = await updateTask(
    this.currentTask.id,
    this.currentUser.token,
    {
      status,
    }
  )
})

Then('la tarea tiene estado {string}', function (status) {
  assert.equal(this.response.data.status, status)
})
