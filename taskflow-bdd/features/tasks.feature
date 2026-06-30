# ============================================================
# EP-03: Gestion de tareas
# US-05: Crear tarea
# US-06: Mover tarea entre estados
# ============================================================

Feature: Gestion de tareas en el tablero
  Como miembro de un proyecto
  Quiero crear y mover tareas
  Para hacer seguimiento del trabajo

  Background:
    Given el servidor de TaskFlow esta disponible
    And la base de datos esta limpia
    And existe un proyecto "Backend Tasks" con un miembro autenticado

  Scenario: Crear tarea con prioridad valida
    When el miembro crea una tarea con:
      | title    | Implementar endpoint de login |
      | priority | HIGH                          |
    Then la respuesta tiene codigo de estado 201
    And la tarea tiene estado "TODO"

  Scenario: No se puede crear una tarea sin autenticacion
    When el miembro crea una tarea sin autenticacion con:
      | title    | Tarea sin auth |
      | priority | MEDIUM         |
    Then la respuesta tiene codigo de estado 401
    And el cuerpo contiene "error" con valor "Missing or invalid authorization header"

  Scenario: No se puede crear una tarea con prioridad invalida
    When el miembro crea una tarea con:
      | title    | Tarea invalida |
      | priority | URGENT         |
    Then la respuesta tiene codigo de estado 400
    And el cuerpo contiene "error" con valor "Validation error"

  Scenario: Mover una tarea de TODO a IN_PROGRESS
    Given que existe la tarea "Fix login bug" en estado TODO
    When el miembro mueve la tarea al estado "IN_PROGRESS"
    Then la respuesta tiene codigo de estado 200
    And la tarea tiene estado "IN_PROGRESS"

  Scenario: No se puede mover una tarea de TODO a DONE directamente
    Given que existe la tarea "Deploy pipeline" en estado TODO
    When el miembro mueve la tarea al estado "DONE"
    Then la respuesta tiene codigo de estado 422
    And el cuerpo contiene el campo "error"
