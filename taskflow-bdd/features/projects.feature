# ============================================================
# EP-02: Gestión de Proyectos y Tablero
# US-03: Crear proyecto
# US-04: Invitar miembro
# ============================================================

Feature: Gestión de proyectos
  Como propietario de un proyecto
  Quiero crear y administrar proyectos
  Para organizar el trabajo de mi equipo

  Background:
    Given el servidor de TaskFlow está disponible
    And la base de datos está limpia
    And existe un usuario autenticado con email "owner@test.com"

  Scenario: Crear proyecto con datos válidos
    When el usuario crea un proyecto con:
      | name        | TaskFlow Backend     |
      | description | API REST con Express |
    Then la respuesta tiene código de estado 201

  Scenario: Crear proyecto falla sin autenticación
    When el usuario crea un proyecto sin autenticación con:
      | name        | Proyecto Sin Auth |
      | description | No debería funcionar |
    Then la respuesta tiene código de estado 401
    And el cuerpo contiene "error" con el valor "Missing or invalid authorization header"

  Scenario: No se puede crear un proyecto sin nombre
    When el usuario crea un proyecto con:
      | name        |                 |
      | description | Sin nombre      |
    Then la respuesta tiene código de estado 400
    And el cuerpo contiene "error" con el valor "Validation error"

# Falta :
# Crear proyecto falla sin autenticación
# Listar proyectos propios
# No ver proyectos de otros usuarios