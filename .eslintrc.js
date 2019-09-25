module.exports = {
  root: true,
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2018
      },
  plugins: [
    'node',
    'prettier',
  ],
  extends: [
    'eslint:recommended', 
    'plugin:node/recommended',
    'plugin:prettier/recommended'
  ],
  env: {
    browser: false,
    node: true
  },
  rules: {},
  overrides: [
    // test files
    {
      files: ['test.js'],
      env: {
        qunit: true
      }
    }
  ]
};
