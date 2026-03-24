/**
 * Clase 3 — Módulo 2: Práctica TDD en TaskFlow
 * Testing y Calidad de Software 2026
 *
 * INSTRUCCIONES:
 * 1. Correr los tests: npm run test:unit -- clase3.ejercicios
 * 2. Los tests deben FALLAR inicialmente (fase RED)
 * 3. Implementar el código en task.service.ts / auth.service.ts (fase GREEN)
 * 4. Refactorizar manteniendo los tests en verde (fase REFACTOR)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================
// IMPORTS — ajustar según la estructura real del proyecto
// =============================================================
// import { TaskService }  from '../task.service';
// import { AuthService }  from '../auth.service';
// import { TaskStatus }   from '../../types/task.types';

// =============================================================
// STUBS compartidos
// =============================================================

const mockTaskRepo = {
  findById:  vi.fn(),
  create:    vi.fn(),
  update:    vi.fn(),
  delete:    vi.fn(),
  findMany:  vi.fn(),
};

const mockUserRepo = {
  findById:  vi.fn(),
  findByEmail: vi.fn(),
  create:    vi.fn(),
  update:    vi.fn(),
};

// Helper para crear un usuario mock con N intentos fallidos
function makeUser(failedAttempts: number, isLocked = false) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    failedAttempts,
    isLocked,
    createdAt: new Date(),
  };
}

// =============================================================
// EJERCICIO 1 — validateTitle
// Archivo: apps/api/src/services/task.service.ts
// Tiempo estimado: 20 minutos
// =============================================================

describe('TaskService.validateTitle', () => {

  // TODO: instanciar el servicio con el stub
  // const svc = new TaskService(mockTaskRepo as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Casos inválidos ────────────────────────────────────────

  it('debe lanzar error si el título tiene menos de 3 caracteres', () => {
    // TODO: implementar este test
    // Escribir PRIMERO, luego implementar validateTitle
    expect.fail('Test no implementado — fase RED: escribí el test antes de escribir el código');
  });

  it('debe lanzar error si el título tiene más de 100 caracteres', () => {
    // TODO: implementar este test
    expect.fail('Test no implementado');
  });

  it('debe lanzar error si el título está vacío', () => {
    // TODO: implementar este test
    expect.fail('Test no implementado');
  });

  it('debe lanzar error si el título contiene solo espacios en blanco', () => {
    // TODO: implementar este test
    // Pista: '   ' → error
    expect.fail('Test no implementado');
  });

  // ── Casos válidos ──────────────────────────────────────────

  it('debe aceptar un título válido sin lanzar error', () => {
    // TODO: implementar este test
    expect.fail('Test no implementado');
  });

  it('debe aceptar un título con exactamente 3 caracteres (valor límite inferior)', () => {
    // TODO: implementar este test
    // Pista: 'abc' tiene exactamente 3 caracteres → debe ser válido
    expect.fail('Test no implementado');
  });

  it('debe aceptar un título con exactamente 100 caracteres (valor límite superior)', () => {
    // TODO: implementar este test
    // Pista: 'a'.repeat(100) tiene exactamente 100 caracteres → debe ser válido
    expect.fail('Test no implementado');
  });

});

// =============================================================
// EJERCICIO 2 — validateStatusTransition
// Archivo: apps/api/src/services/task.service.ts
// Tiempo estimado: 25 minutos
// =============================================================

describe('TaskService.validateStatusTransition', () => {

  // TODO: instanciar el servicio con el stub
  // const svc = new TaskService(mockTaskRepo as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Transiciones válidas ───────────────────────────────────

  it('debe permitir la transición TODO → IN_PROGRESS', () => {
    // TODO: implementar este test
    // Pista: TaskStatus.TODO → TaskStatus.IN_PROGRESS no debe lanzar error
    expect.fail('Test no implementado');
  });

  it('debe permitir la transición IN_PROGRESS → DONE', () => {
    // TODO: implementar este test
    expect.fail('Test no implementado');
  });

  // ── Transiciones inválidas ─────────────────────────────────

  it('debe rechazar la transición TODO → DONE (salto de estado)', () => {
    // TODO: implementar este test
    // El error debe incluir los nombres de los estados:
    // "Transición de estado inválida: TODO → DONE"
    expect.fail('Test no implementado');
  });

  it('debe rechazar la transición IN_PROGRESS → TODO (retroceso)', () => {
    // TODO: implementar este test
    expect.fail('Test no implementado');
  });

  it('debe rechazar cualquier transición desde DONE (estado final)', () => {
    // TODO: implementar este test
    // DONE es un estado final — no puede transicionar a nada
    expect.fail('Test no implementado');
  });

  it('debe rechazar la transición al mismo estado', () => {
    // TODO: implementar este test
    // Ejemplo: TODO → TODO debe ser inválido
    expect.fail('Test no implementado');
  });

});

// =============================================================
// EJERCICIO 3 — handleFailedLogin y bloqueo de cuenta (BUG-05)
// Archivo: apps/api/src/services/auth.service.ts
// Tiempo estimado: 25 minutos
// ⚠  Este ejercicio contiene un bug intencional en el código.
//    Uno de los tests va a FALLAR al ejecutar — eso es correcto.
//    Encontrá el bug, corregilo, y volvé a ejecutar.
// =============================================================

describe('AuthService.handleFailedLogin', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('después del 1er intento fallido: failedAttempts debe ser 1 y la cuenta NO debe estar bloqueada', async () => {
    // TODO: implementar este test
    // Pista: usar makeUser(0) como estado inicial
    // Pista: mockUserRepo.update debe capturar los datos que se guardaron
    expect.fail('Test no implementado');
  });

  it('después del 4to intento fallido: failedAttempts debe ser 4 y la cuenta NO debe estar bloqueada', async () => {
    // TODO: implementar este test
    // Pista: usar makeUser(3) como estado inicial (ya tiene 3 intentos)
    expect.fail('Test no implementado');
  });

  it('después del 5to intento fallido: failedAttempts debe ser 5 y la cuenta SÍ debe estar bloqueada', async () => {
    // TODO: implementar este test
    // ⚠  ESTE TEST VA A FALLAR con el código actual (BUG-05)
    // Pista: usar makeUser(4) como estado inicial
    // Pista: verificar que isLocked === true en los datos pasados a update
    expect.fail('Test no implementado');
  });

  it('si la cuenta ya está bloqueada, no debe modificar failedAttempts', async () => {
    // TODO: implementar este test
    // Pista: usar makeUser(5, true) — cuenta ya bloqueada
    // Pista: verificar que update no fue llamado, o que failedAttempts no cambió
    expect.fail('Test no implementado');
  });

});

// =============================================================
// ESPACIO PARA TESTS ADICIONALES (opcional)
// Si terminaron los 3 ejercicios, agreguen tests extra aquí
// =============================================================

describe('Ejercicios adicionales (opcional)', () => {

  it.todo('validateTitle: título con solo emojis — ¿qué debería pasar?');
  it.todo('validateTitle: título con espacios al inicio y al final — ¿se recorta?');
  it.todo('validateStatusTransition: DONE → DONE — ¿mismo error que otras transiciones desde DONE?');

});
