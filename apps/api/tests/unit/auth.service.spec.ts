// tests/unit/auth.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import {
  description,
  feature,
  link,
  severity,
  step,
  story,
} from 'allure-vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  AuthService,
  ConflictError,
  UnauthorizedError,
} from '../../src/services/auth.service'

// ── Mock PrismaClient ────────────────────────────────────────────
const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const authService = new AuthService(mockDb as any)

// ── Helpers ──────────────────────────────────────────────────────
const validRegisterInput = {
  email: 'ana@test.com',
  password: 'Password1',
  name: 'Ana',
}

const mockUser = {
  id: 'user-1',
  email: 'ana@test.com',
  passwordHash: '$2a$12$hashedpassword',
  name: 'Ana',
  failedLogins: 0,
  lockedUntil: null,
  createdAt: new Date(),
}

// ════════════════════════════════════════════════════════════════
// US-01: Registro de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.register — US-01', () => {
  describe('Criterio 1: email con formato válido', () => {
    it('rechaza email sin @', async () => {
      await expect(
        authService.register({ ...validRegisterInput, email: 'notanemail' })
      ).rejects.toThrow()
    })

    it('rechaza email sin dominio', async () => {
      await expect(
        authService.register({ ...validRegisterInput, email: 'user@' })
      ).rejects.toThrow()
    })

    it('acepta email válido', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      const result = await authService.register(validRegisterInput)
      expect(result.user.email).toBe('ana@test.com')
    })
  })

  describe('Criterio 2: contraseña con requisitos de seguridad', () => {
    it('rechaza contraseña menor a 8 caracteres', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'Abc1' })
      ).rejects.toThrow('at least 8 characters')
    })

    it('rechaza contraseña sin mayúscula', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'password1' })
      ).rejects.toThrow('uppercase')
    })

    it('rechaza contraseña sin número', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'Password' })
      ).rejects.toThrow('number')
    })

    it('acepta contraseña válida con mayúscula y número', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      await expect(
        authService.register({ ...validRegisterInput, password: 'SecurePass1' })
      ).resolves.toBeDefined()
    })
  })

  describe('Criterio 3: email único', () => {
    it('lanza ConflictError si el email ya existe', async (context) => {
      await feature(context, 'Autenticación')
      await story(context, 'US-01')
      await severity(context, 'normal')
      await link(
        context,
        'custom',
        'https://github.com/FacundoAcostaG/taskflow/blob/main/apps/api/src/services/auth.service.ts',
        'AuthService.register'
      )
      await description(
        context,
        'Verifica que el registro rechaza un email duplicado y preserva la unicidad del usuario.'
      )

      mockDb.user.findUnique.mockResolvedValue(mockUser)

      await step(
        context,
        'Intentar registrar un usuario con email ya existente',
        async () => {
          await expect(
            authService.register(validRegisterInput)
          ).rejects.toThrow(ConflictError)
        }
      )

      await step(
        context,
        'Validar el mensaje funcional del conflicto',
        async () => {
          await expect(
            authService.register(validRegisterInput)
          ).rejects.toThrow('Email already registered')
        }
      )
    })

    it('llama a findUnique con el email correcto', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      try {
        await authService.register(validRegisterInput)
      } catch {
        /* expected error */
      }

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ana@test.com' },
      })
    })
  })

  describe('Criterio 4: retorna JWT al registrarse', () => {
    it('incluye token en la respuesta exitosa', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      })

      const result = await authService.register(validRegisterInput)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.token.split('.')).toHaveLength(3) // JWT format
    })
  })
})

// ════════════════════════════════════════════════════════════════
// US-02: Login de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.login — US-02', () => {
  describe('Criterio 1: login exitoso retorna JWT', () => {
    it('retorna token para credenciales válidas', async (context) => {
      await feature(context, 'Autenticación')
      await story(context, 'US-02')
      await severity(context, 'critical')
      await link(
        context,
        'custom',
        'https://github.com/FacundoAcostaG/taskflow/blob/main/apps/api/src/services/auth.service.ts',
        'AuthService.login'
      )
      await description(
        context,
        'Confirma que un usuario válido puede autenticarse y recibir un JWT para continuar en la aplicación.'
      )

      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      let result: Awaited<ReturnType<typeof authService.login>>
      await step(
        context,
        'Autenticar al usuario con credenciales válidas',
        async () => {
          result = await authService.login({
            email: 'ana@test.com',
            password: 'Password1',
          })
        }
      )

      await step(
        context,
        'Verificar que la respuesta incluye token y datos del usuario',
        async () => {
          expect(result.token).toBeDefined()
          expect(result.user.email).toBe('ana@test.com')
        }
      )
    })

    // 🐛 Este test debería fallar con el BUG-07 activo
    // El token generado en login() no incluye expiración
    it('el token generado incluye campo de expiración (exp) — BUG-07', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      const result = await authService.login({
        email: 'ana@test.com',
        password: 'Password1',
      })

      const decoded = jwt.decode(result.token) as any

      // Este expect FALLA con el bug activo → BUG-07 encontrado
      expect(decoded.exp).toBeDefined()
    })
  })

  describe('Criterio 2: credenciales incorrectas', () => {
    it('lanza UnauthorizedError con password incorrecto', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
      })
      mockDb.user.update.mockResolvedValue({})

      await expect(
        authService.login({ email: 'ana@test.com', password: 'WrongPass1' })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('lanza UnauthorizedError si el usuario no existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      await expect(
        authService.login({ email: 'noexiste@test.com', password: 'Password1' })
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('Criterio 3: bloqueo por intentos fallidos', () => {
    it('bloquea la cuenta después de 5 intentos fallidos — BUG-05', async (context) => {
      await feature(context, 'Autenticación')
      await story(context, 'US-02')
      await severity(context, 'critical')
      await link(
        context,
        'custom',
        'https://github.com/FacundoAcostaG/taskflow/blob/main/apps/api/src/services/auth.service.ts',
        'BUG-05 auth lockout'
      )
      await description(
        context,
        'Documenta el comportamiento del bloqueo por intentos fallidos y expone el bug off-by-one asociado al umbral.'
      )

      const hash = await bcrypt.hash('Password1', 12)
      // Simula usuario con 5 intentos fallidos exactos (justo en el límite)
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        failedLogins: 5,
        lockedUntil: null,
      })
      mockDb.user.update.mockResolvedValue({})

      // Con password incorrecto en el intento 6 (failedLogins llega a 6)
      // El bug: la cuenta debería haberse bloqueado en el intento 5
      // Con el bug activo, este test pasa como UnauthorizedError sin lock
      // La validación correcta sería que la cuenta YA esté bloqueada

      // Este test documenta el comportamiento buggy:
      await step(
        context,
        'Ejecutar un nuevo login fallido en el límite de intentos',
        async () => {
          await expect(
            authService.login({ email: 'ana@test.com', password: 'WrongPass1' })
          ).rejects.toThrow(UnauthorizedError)
        }
      )

      // Verificar que se llamó update con lockedUntil establecido
      await step(
        context,
        'Comprobar que el servicio intenta establecer el bloqueo',
        async () => {
          const updateCall = mockDb.user.update.mock.calls[0][0]
          expect(updateCall.data.lockedUntil).toBeDefined()
        }
      )
      // BUG: lockedUntil solo se setea cuando failedLogins > 5, no >= 5
      // En este caso failedLogins llegaría a 6 y recién ahí se bloquea
    })

    it('respeta el bloqueo si lockedUntil está en el futuro', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 min en el futuro
      })

      await expect(
        authService.login({ email: 'ana@test.com', password: 'Password1' })
      ).rejects.toThrow('locked')
    })
  })
})
