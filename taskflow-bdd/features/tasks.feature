# ============================================================
# EP-03: Gestión de Tareas (Issues)
# US-05: Crear tarea
# US-06: Mover tarea entre columnas
# ============================================================

Feature: Gestión de tareas en el tablero
  Como miembro de un proyecto
  Quiero crear y mover tareas en el tablero
  Para hacer seguimiento del trabajo

  Background:
    Given el servidor de TaskFlow está disponible
    And la base de datos está limpia
    And existe un proyecto "Backend Tasks" con un miembro autenticado

  Scenario: Crear tarea con todos los campos
    When el miembro crea una tarea con:
      | title    | Implementar endpoint de login |
      | priority | HIGH                          |
    Then la respuesta tiene código de estado 201
    And la tarea tiene estado "TODO"
  
  # @only
  # Scenario: Mover tarea a In Progress
  #   Given que existe la tarea "Fix login bug" en la columna TODO
  #   When el miembro mueve la tarea a la columna "IN_PROGRESS"
  #   Then la respuesta tiene código de estado 200
  #   And la tarea tiene estado "IN_PROGRESS"