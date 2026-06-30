const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

let response = null;
let currentUser = null;
let currentProject = null;
let currentTask = null;

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(this.response).to.not.be.null;
  expect(this.response.status).to.equal(expectedStatus,
    `Se esperaba status ${expectedStatus} pero se recibió ${this.response.status}`
  );
});

Then('el cuerpo contiene el campo {string}', function (field) {
  expect(this.response.data).to.have.property(field);
});

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(this.response.data).to.have.property(field);
  expect(String(this.response.data[field])).to.equal(value);
});