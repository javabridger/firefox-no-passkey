module.exports = {
  unit: {
    paths: ['test/unit/features/**/*.feature'],
    require: ['test/unit/steps/**/*.js'],
  },
  e2e: {
    paths: ['test/e2e/features/**/*.feature'],
    require: ['test/e2e/support/**/*.js', 'test/e2e/steps/**/*.js'],
    timeout: 120000,
  },
};
