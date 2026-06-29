import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '../../src/projects'

describe('createProject helper', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts a project and returns the parsed JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 'project-1',
        name: 'Alpha',
        ownerId: 'user-1',
      }),
    } as any)

    const result = await createProject(
      'http://localhost:3000',
      'Alpha',
      'Main project',
      'token-123'
    )

    expect(result).toEqual({
      id: 'project-1',
      name: 'Alpha',
      ownerId: 'user-1',
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3000/api/projects',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    )
  })

  it('throws when the API responds with an error status', async () => {
    vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: false,
      status: 500,
    } as any)

    await expect(
      createProject('http://localhost:3000', 'Alpha', 'Main project', 'token')
    ).rejects.toThrow('Error 500')
  })
})
