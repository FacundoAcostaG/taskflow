import { describe, it, expect } from 'vitest'
import { PactV4, MatchersV3 } from '@pact-foundation/pact'
import path from 'path'
import { createProject } from '../../../api/src/projects'
import { match } from 'assert'

const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  // El contrato se guarda en pacts/ en la raíz del monorepo
  dir: path.resolve(__dirname, '../../../../pacts'),
})

describe('Consumer Pact — createProject', () => {
  it('POST /api/projects devuelve 201 con id, name y ownerId', async () => {
    await provider
      .addInteraction()
      .given('usuario autenticado con token válido')
      .uponReceiving('una petición para crear proyecto TaskFlow MVP')
      .withRequest('POST', '/projects', (builder) => {
        builder.headers({ 'Content-Type': 'application/json' })
        builder.jsonBody({
          name: MatchersV3.string('TaskFlow MVP'),
          description: MatchersV3.string('desc'),
        })
      })
      .willRespondWith(201, (builder) => {
        builder.jsonBody({
          // ¿qué matchers usarías para cada campo?
          id: MatchersV3.uuid(),
          name: MatchersV3.string('TaskFlow MVP'),
          ownerId: MatchersV3.uuid(),
        })
      })
      .executeTest(async (mockServer) => {
        const result = await createProject(
          mockServer.url,
          'TaskFlow MVP',
          'desc',
          'token-de-test'
        )
        expect(result.id).toBeDefined()
        expect(result.name).toBe('TaskFlow MVP')
      })
  })
})
