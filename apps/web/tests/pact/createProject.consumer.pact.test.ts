import path from 'path'
import { describe, expect, it } from 'vitest'
import { MatchersV3, PactV4 } from '@pact-foundation/pact'
import { createProject } from '../../src/api/projects'

const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  dir: path.resolve(__dirname, '../../../../pacts'),
})

describe('Consumer Pact - createProject', () => {
  it('POST /api/projects devuelve 201 con id, name y ownerId', async () => {
    await provider
      .addInteraction()
      .given('usuario autenticado con token válido')
      .uponReceiving('una petición para crear proyecto TaskFlow MVP')
      .withRequest('POST', '/api/projects', (builder) => {
        builder.headers({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-de-test',
        })
        builder.jsonBody({
          name: MatchersV3.string('TaskFlow MVP'),
          description: MatchersV3.string('desc'),
        })
      })
      .willRespondWith(201, (builder) => {
        builder.jsonBody({
          id: MatchersV3.string('cproj123456789'),
          name: MatchersV3.string('TaskFlow MVP'),
          ownerId: MatchersV3.string('cuser123456789'),
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
