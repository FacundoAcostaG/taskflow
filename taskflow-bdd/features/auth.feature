# ============================================================
# EP-01: Gestion de autenticacion y acceso
# US-01: Registro de usuario
# US-02: Login de usuario
# ============================================================

Feature: Autenticacion y gestion de acceso
  Como usuario de TaskFlow
  Quiero poder registrarme e iniciar sesion
  Para acceder a mis proyectos y tareas

  Background:
    Given el servidor de TaskFlow esta disponible
    And la base de datos esta limpia

  Scenario: Registro exitoso con datos validos
    Given que el email "nuevo@test.com" no esta registrado
    When el usuario envia los datos de registro:
      | email    | nuevo@test.com |
      | password | Secure123      |
      | name     | Juan Perez     |
    Then la respuesta tiene codigo de estado 201
    And el cuerpo contiene el campo "token"

  Scenario: Registro rechazado con email duplicado
    Given que el email "existente@test.com" ya esta registrado
    When el usuario envia los datos de registro:
      | email    | existente@test.com |
      | password | OtraPass456        |
      | name     | Maria Garcia       |
    Then la respuesta tiene codigo de estado 409
    And el cuerpo contiene "error" con valor "Email already registered"

  Scenario: Registro rechazado con contrasena muy corta
    Given que el email "nuevo2@test.com" no esta registrado
    When el usuario envia los datos de registro:
      | email    | nuevo2@test.com |
      | password | corta           |
      | name     | Test User       |
    Then la respuesta tiene codigo de estado 400
    And el cuerpo contiene "error" con valor "Validation error"

  Scenario: Registro rechazado con email invalido
    Given que ningun usuario esta registrado
    When el usuario envia los datos de registro:
      | email    | email-sin-arroba |
      | password | ValidPass123     |
      | name     | Test User        |
    Then la respuesta tiene codigo de estado 400
    And el cuerpo contiene "error" con valor "Validation error"

  Scenario: Login exitoso con credenciales validas
    Given que existe el usuario con email "usuario@test.com" y password "Pass1234"
    When el usuario envia las credenciales:
      | email    | usuario@test.com |
      | password | Pass1234         |
    Then la respuesta tiene codigo de estado 200
    And el cuerpo contiene el campo "token"

  Scenario: Login rechazado con contrasena incorrecta
    Given que existe el usuario con email "usuario@test.com" y password "Pass1234"
    When el usuario envia las credenciales:
      | email    | usuario@test.com |
      | password | ContrasenaMal456 |
    Then la respuesta tiene codigo de estado 401
    And el cuerpo contiene "error" con valor "Invalid credentials"
