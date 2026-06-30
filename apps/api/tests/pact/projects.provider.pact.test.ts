import path from 'path'
import { AddressInfo } from 'net'
import { PrismaClient } from '@prisma/client'
import { Verifier } from '@pact-foundation/pact'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../src/app'
import { generateTestJWT } from '../helpers/auth.helper'

const prisma = new PrismaClient()
const app = createApp()

const PACT_USER_ID = 'pact-user-1'
const PACT_USER_EMAIL = 'pact@test.com'

describe('Provider verification - taskflow-api', () => {
  let server: ReturnType<typeof app.listen> | undefined
  let port: number

  beforeAll(async () => {
    await prisma.project.deleteMany({ where: { ownerId: PACT_USER_ID } })
    await prisma.projectMember.deleteMany({ where: { userId: PACT_USER_ID } })
    await prisma.user.deleteMany({ where: { id: PACT_USER_ID } })

    await prisma.user.create({
      data: {
        id: PACT_USER_ID,
        email: PACT_USER_EMAIL,
        passwordHash: 'hash',
      },
    })

    server = app.listen(0)
    port = (server.address() as AddressInfo).port
  })

  it('verifica el contrato del consumer taskflow-frontend', async () => {
    const pactPath = path.resolve(
      __dirname,
      '../../../../pacts/taskflow-frontend-taskflow-api.json'
    )

    await expect(
      new Verifier({
        provider: 'taskflow-api',
        providerBaseUrl: `http://127.0.0.1:${port}`,
        pactUrls: [pactPath],
        requestFilter: (req, _res, next) => {
          req.headers.authorization = `Bearer ${generateTestJWT(PACT_USER_ID)}`
          next()
        },
        stateHandlers: {
          'usuario autenticado con token válido': async () => {
            await prisma.project.deleteMany({
              where: { ownerId: PACT_USER_ID },
            })
            return {}
          },
        },
      }).verifyProvider()
    ).resolves.toBeTypeOf('string')
  })

  afterAll(async () => {
    server?.close()
    await prisma.project.deleteMany({ where: { ownerId: PACT_USER_ID } })
    await prisma.projectMember.deleteMany({ where: { userId: PACT_USER_ID } })
    await prisma.user.deleteMany({ where: { id: PACT_USER_ID } })
    await prisma.$disconnect()
  })
})
