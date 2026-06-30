# ============================================================
# EP-02: Gestion de proyectos y tablero
# US-03: Crear proyecto
# US-04: Listar proyectos visibles del usuario
# ============================================================

Feature: Gestion de proyectos
  Como usuario autenticado
  Quiero crear y consultar mis proyectos
  Para organizar el trabajo de mi equipo

  Background:
    Given el servidor de TaskFlow esta disponible
    And la base de datos esta limpia
    And existe un usuario autenticado con email "owner@test.com"

  Scenario: Crear proyecto con datos validos
    When el usuario crea un proyecto con:
      | name        | TaskFlow Backend     |
      | description | API REST con Express |
    Then la respuesta tiene codigo de estado 201
    And el cuerpo contiene el campo "id"

  Scenario: Crear proyecto falla sin autenticacion
    When el usuario crea un proyecto sin autenticacion con:
      | name        | Proyecto Sin Auth |
      | description | No deberia crear  |
    Then la respuesta tiene codigo de estado 401
    And el cuerpo contiene "error" con valor "Missing or invalid authorization header"

  Scenario: No se puede crear un proyecto sin nombre valido
    When el usuario crea un proyecto con:
      | name        |  |
      | description | Sin nombre |
    Then la respuesta tiene codigo de estado 400
    And el cuerpo contiene "error" con valor "Validation error"

  Scenario: El usuario solo ve sus propios proyectos
    Given que existe un proyecto "Proyecto propio" del usuario "owner@test.com"
    And que existe un proyecto "Proyecto ajeno" de otro usuario "other@test.com"
    When el usuario consulta sus proyectos
    Then la respuesta tiene codigo de estado 200
    And el listado incluye el proyecto "Proyecto propio"
    And el listado no incluye el proyecto "Proyecto ajeno"
