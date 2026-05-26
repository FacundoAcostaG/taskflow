import { describe, it, expect, vi, beforeAll, type MockedObject } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
vi.mock('../../src/services/task.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/services/task.service')>
        ()
    return {
        ...actual,
        TaskService: vi.fn().mockImplementation(() => ({
            createTask: vi.fn(),
            getTasksByProject: vi.fn(),
        })),
    }
})
vi.mock('../../src/services/auth.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/services/auth.service')>
        ()
    return {
        ...actual,
        AuthService: vi.fn().mockImplementation(() => ({
            verifyToken: vi.fn().mockReturnValue({ id: 'user-1', email: 'ana@test.com' }),
        })),
    }
})
import { TaskService } from '../../src/services/task.service'
import type { TaskService as TaskServiceType } from '../../src/services/task.service'
const app = createApp()
const VALID_TOKEN = 'Bearer valid.jwt.token'
let taskServiceMock: MockedObject<TaskServiceType>
beforeAll(() => {
    taskServiceMock = (TaskService as ReturnType<typeof vi.fn>).mock.results[0].value
})

describe('POST /projects/:projectId/tasks', () => {
 it('201 — crea tarea y devuelve el objeto creado', async () => {
    taskServiceMock.createTask.mockResolvedValue({
        id: 'task-1',
        title: 'Implementar Login',
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'proj-1',
        assignedTo: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
    })
    const res = await request(app)
        .post('/projects/proj-1/tasks')
        .set('Authorization', VALID_TOKEN)
        .send({ title: 'Implementar Login', priority: 'HIGH' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.title).toBe('Implementar Login')
})
 it('400 — título vacío', async () => {
    // CORRECCIÓN 1: el mock anterior usaba mockResolvedValue, lo que hacía que
    // createTask siempre devolviera éxito sin importar el input recibido.
    // Como el servicio está completamente mockeado, la validación real
    // (validateTitle y CreateTaskSchema.parse) nunca se ejecutaba, y la ruta
    // devolvía 201. Ahora usamos mockRejectedValueOnce para simular lo que
    // haría el servicio real ante un título inválido: lanzar un ZodError.
    // El errorHandler de la app ya está programado para convertir ZodError → 400.
    const { ZodError, ZodIssueCode } = await import('zod')
    taskServiceMock.createTask.mockRejectedValueOnce( //Mock rejected value en lugar de mock Resolved value
        new ZodError([{
            code: ZodIssueCode.too_small,
            path: ['title'],
            message: 'String must contain at least 3 character(s)',
            minimum: 3,
            type: 'string',
            inclusive: true,
        }])
    )
    const res = await request(app)
        .post('/projects/proj-1/tasks')
        .set('Authorization', VALID_TOKEN)
        .send({ title: '', priority: 'HIGH' })
    expect(res.status).toBe(400)
    // CORRECCIÓN 2: las assertions anteriores chequeaban res.body.id y
    // res.body.title, que son campos de una tarea creada exitosamente (201).
    // Una respuesta 400 devuelve { error: '...', details: [...] }, no un objeto
    // tarea. Se reemplaza por una assertion coherente con el cuerpo de error.
    expect(res.body.error).toBeDefined()
})

 it('401 — sin token', async () => {
        taskServiceMock.createTask.mockResolvedValue({
        id: 'task-1',
        title: '',
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'proj-1',
        assignedTo: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
    })
    const res = await request(app)
        .post('/projects/proj-1/tasks')
        .set('Authorization', "")
        .send({ title: '', priority: 'HIGH' })
    expect(res.status).toBe(401)
})
})

// =============================================================================
// GUÍA DE MOCKS — Vitest (misma API que Jest)
// =============================================================================
//
// Un mock reemplaza una función real por una "falsa" que vos controlás.
// El objetivo es aislar la unidad bajo prueba: en estos tests queremos probar
// que la RUTA responde correctamente, sin depender de la base de datos ni de
// la lógica interna del servicio.
//
// Cuando mockeamos TaskService completo (líneas 4-14), TODAS las llamadas a
// métodos como createTask() van al mock. El código real del servicio
// (validaciones, queries a la DB) nunca se ejecuta. Por eso el mock tiene
// la responsabilidad de simular los distintos escenarios posibles.
//
// -----------------------------------------------------------------------------
// LOS MÉTODOS PRINCIPALES
// -----------------------------------------------------------------------------
//
// SÍNCRONOS (para funciones que devuelven un valor directo, no una Promise):
//
//   .mockReturnValue(x)
//       → Cada vez que se llame a la función, devuelve x.
//       → Usado en este archivo para verifyToken (línea 21): siempre devuelve
//         el mismo payload de usuario sin importar qué token se le pase.
//
//   .mockReturnValueOnce(x)
//       → Igual, pero solo para la PRÓXIMA llamada. Luego se descarta.
//
// -----------------------------------------------------------------------------
//
// ASINCRÓNICOS EXITOSOS (la función es async y la operación sale bien):
//
//   .mockResolvedValue(x)
//       → Cada llamada devuelve Promise.resolve(x), es decir, éxito con x.
//       → Usado en el test 201: simulamos que createTask guardó la tarea y
//         devolvió el objeto completo. La ruta lo recibe, responde 201.
//       → También en el test 401: el mock está configurado, pero como el
//         middleware de auth corta antes, createTask nunca se llega a llamar.
//
//   .mockResolvedValueOnce(x)
//       → Igual, pero solo para la próxima llamada.
//
// -----------------------------------------------------------------------------
//
// ASINCRÓNICOS CON ERROR (la función es async y la operación falla):
//
//   .mockRejectedValue(err)
//       → Cada llamada devuelve Promise.reject(err), es decir, lanza el error.
//
//   .mockRejectedValueOnce(err)
//       → Igual, pero solo para la próxima llamada.
//       → Usado en el test 400: simulamos que createTask lanzó un ZodError
//         porque el título estaba vacío. La ruta lo captura con next(err),
//         el errorHandler lo detecta como ZodError y responde 400.
//
// -----------------------------------------------------------------------------
//
// CONTROL TOTAL SOBRE LA LÓGICA (cuando el resultado depende del input):
//
//   .mockImplementation((arg1, arg2, ...) => { ... })
//       → Reemplaza la función con tu propia implementación.
//       → Útil cuando necesitás que el mock se comporte distinto según los
//         argumentos que recibe. Ejemplo:
//
//         taskServiceMock.createTask.mockImplementation(async (_projId, _userId, input) => {
//           if (!input.title || input.title.trim() === '') {
//             throw new ZodError([...])   // simula validación fallida
//           }
//           return { id: 'task-1', title: input.title, ... }  // simula éxito
//         })
//
//   .mockImplementationOnce(fn)
//       → Igual, pero solo para la próxima llamada.
//
// -----------------------------------------------------------------------------
// ENCADENAR Once PARA SIMULAR UNA SECUENCIA
// -----------------------------------------------------------------------------
//
// Podés llamar varios Once seguidos sobre el mismo mock para simular que en
// distintas llamadas consecutivas el servicio se comporta diferente:
//
//   taskServiceMock.createTask
//     .mockResolvedValueOnce({ id: 'task-1' })        // 1ra llamada → éxito
//     .mockRejectedValueOnce(new Error('DB caída'))   // 2da llamada → error
//     .mockResolvedValueOnce({ id: 'task-3' })        // 3ra llamada → éxito
//
// -----------------------------------------------------------------------------
// TABLA RESUMEN — ¿CUÁL USO EN CADA CASO?
// -----------------------------------------------------------------------------
//
//   ┌─────────────────────────────────────────────┬────────────────────────────┐
//   │ Situación                                   │ Método                     │
//   ├─────────────────────────────────────────────┼────────────────────────────┤
//   │ La llamada debe FUNCIONAR (caso feliz)      │ mockResolvedValue          │
//   │ La llamada debe FALLAR (error, validación)  │ mockRejectedValue          │
//   │ Función síncrona (no async)                 │ mockReturnValue            │
//   │ Cada test necesita su propio valor          │ agregar Once al final      │
//   │ El resultado depende de los argumentos      │ mockImplementation         │
//   │ Simular varios resultados en secuencia      │ encadenar ...Once()        │
//   └─────────────────────────────────────────────┴────────────────────────────┘
//
// -----------------------------------------------------------------------------
// EL ERROR CONCEPTUAL QUE TENÍA ESTE TEST (para que no se repita)
// -----------------------------------------------------------------------------
//
// El test 400 usaba mockResolvedValue → el mock siempre tenía éxito.
// Un mock no sabe nada del input que recibe: simplemente devuelve lo que vos
// le dijiste que devuelva. No "lee" el título vacío ni ejecuta ninguna
// validación. Por eso la ruta devolvía 201 en vez de 400.
//
// Regla: el mock tiene que simular el COMPORTAMIENTO ESPERADO del servicio
// para ese escenario. Si el escenario es "título inválido", el mock debe
// lanzar el error que lanzaría el servicio real en esa situación.
//
// =============================================================================