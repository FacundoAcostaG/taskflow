module.exports = {
  default: {
    require: ['features/step_definitions/**/*.js'],
    format: ['progress-bar', 'html:cucumber-report.html'],
    parallel: 0,
  },
}
