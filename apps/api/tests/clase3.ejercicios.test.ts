/**
 * Clase 3 - Modulo 2: Practica TDD en TaskFlow
 * Testing y Calidad de Software 2026
 *
 * INSTRUCCIONES:
 * 1. Correr los tests: npm run test:unit -- clase3.ejercicios
 * 2. Los tests deben FALLAR inicialmente (fase RED)
 * 3. Implementar el codigo en task.service.ts / auth.service.ts (fase GREEN)
 * 4. Refactorizar manteniendo los tests en verde (fase REFACTOR)
 */

import bcrypt from 'bcryptjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Status } from '../src/prisma/enums';
import { AuthService } from '../src/services/auth.service';
import { MAX_CHAR_TASK_NAME, MIN_CHAR_TASK_NAME, TaskService } from '../src/services/task.service';

const mockTaskRepo = {
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findMany: vi.fn(),
};

const baseAuthUser = {
  id: 'u1',
  email: 'test@test.com',
  passwordHash: 'hash',
};

describe('TaskService.validateTitle', () => {
  const svc = new TaskService(mockTaskRepo as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe lanzar error si el titulo tiene menos de 3 caracteres', () => {
    expect(() => svc['validateTitle']('a'.repeat(MIN_CHAR_TASK_NAME - 1))).toThrow();
  });

  it('debe lanzar error si el titulo tiene mas de 100 caracteres', () => {
    expect(() => svc['validateTitle']('a'.repeat(MAX_CHAR_TASK_NAME + 1))).toThrow();
  });

  it('debe lanzar error si el titulo esta vacio', () => {
    expect(() => svc['validateTitle']('')).toThrow();
  });

  it('debe lanzar error si el titulo contiene solo espacios en blanco', () => {
    expect(() => svc['validateTitle']('   ')).toThrow();
  });

  it('debe aceptar un titulo valido sin lanzar error', () => {
    expect(() => svc['validateTitle']('Mi tarea')).not.toThrow();
  });

  it('debe aceptar un titulo con exactamente 3 caracteres (valor limite inferior)', () => {
    expect(() => svc['validateTitle']('abc')).not.toThrow();
  });

  it('debe aceptar un titulo con exactamente 100 caracteres (valor limite superior)', () => {
    expect(() => svc['validateTitle']('a'.repeat(MAX_CHAR_TASK_NAME))).not.toThrow();
  });
});

describe('TaskService.validateStatusTransition', () => {
  const svc = new TaskService(mockTaskRepo as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe permitir la transicion TODO -> IN_PROGRESS', () => {
    expect(() => svc['validateStatusTransition'](Status.TODO, Status.IN_PROGRESS)).not.toThrow();
  });

  it('debe permitir la transicion IN_PROGRESS -> DONE', () => {
    expect(() => svc['validateStatusTransition'](Status.IN_PROGRESS, Status.DONE)).not.toThrow();
  });

  it('debe rechazar la transicion TODO -> DONE (salto de estado)', () => {
    expect(() => svc['validateStatusTransition'](Status.TODO, Status.DONE)).toThrow();
  });

  it('debe permitir la transicion IN_PROGRESS -> TODO (reapertura controlada)', () => {
    expect(() => svc['validateStatusTransition'](Status.IN_PROGRESS, Status.TODO)).not.toThrow();
  });

  it('debe rechazar cualquier transicion desde DONE (estado final)', () => {
    expect(() => svc['validateStatusTransition'](Status.DONE, Status.TODO)).toThrow();
    expect(() => svc['validateStatusTransition'](Status.DONE, Status.IN_PROGRESS)).toThrow();
    expect(() => svc['validateStatusTransition'](Status.DONE, Status.DONE)).toThrow();
  });

  it('debe rechazar la transicion al mismo estado', () => {
    expect(() => svc['validateStatusTransition'](Status.TODO, Status.TODO)).toThrow();
    expect(() => svc['validateStatusTransition'](Status.IN_PROGRESS, Status.IN_PROGRESS)).toThrow();
    expect(() => svc['validateStatusTransition'](Status.DONE, Status.DONE)).toThrow();
  });
});

describe('AuthService.handleFailedLogin', () => {
  function createAuthContext(failedLogins: number, lockedUntil: Date | null = null) {
    const mockUser = {
      ...baseAuthUser,
      failedLogins,
      lockedUntil,
    };

    const mockDb = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
        update: vi.fn().mockImplementation(async ({ data }) => {
          Object.assign(mockUser, data);
          return mockUser;
        }),
      },
    };

    return { mockUser, mockDb, authSvc: new AuthService(mockDb as any) };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
  });

  it('despues del 1er intento fallido: failedAttempts debe ser 1 y la cuenta NO debe estar bloqueada', async () => {
    const { authSvc, mockDb } = createAuthContext(0);

    await expect(
      authSvc.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow();

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        failedLogins: 1,
        lockedUntil: null,
      },
    });
  });

  it('despues del 4to intento fallido: failedAttempts debe ser 4 y la cuenta NO debe estar bloqueada', async () => {
    const { authSvc, mockDb } = createAuthContext(3);

    await expect(
      authSvc.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow();

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        failedLogins: 4,
        lockedUntil: null,
      },
    });
  });

  it('despues del 5to intento fallido: failedAttempts debe ser 5 y la cuenta SI debe estar bloqueada', async () => {

    const { authSvc, mockDb } = createAuthContext(4);

    await expect(
      authSvc.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow();

    expect(mockDb.user.update).toHaveBeenCalledTimes(1);
    const updateArg = mockDb.user.update.mock.calls[0][0];
    expect(updateArg.data.failedLogins).toBe(5);
    expect(updateArg.data.lockedUntil).toBeInstanceOf(Date);
  });

  it('si la cuenta ya esta bloqueada, no debe modificar failedAttempts', async () => {
    const { authSvc, mockDb } = createAuthContext(
      5,
      new Date(Date.now() + 15 * 60 * 1000)
    );

    await expect(
      authSvc.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow();

    expect(mockDb.user.update).not.toHaveBeenCalled();
  });
});

describe('Ejercicios adicionales (opcional)', () => {
  it.todo('validateTitle: titulo con solo emojis - que deberia pasar?');
  it.todo('validateTitle: titulo con espacios al inicio y al final - se recorta?');
  it.todo('validateStatusTransition: DONE -> DONE - mismo error que otras transiciones desde DONE?');
});
