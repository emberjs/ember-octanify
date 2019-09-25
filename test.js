const { createTempDir } = require('broccoli-test-helper');
const execa = require('execa');

const { test } = QUnit;
const ROOT = process.cwd();
const OCTANIFY_PATH = require.resolve('./index');

QUnit.module('@ember/octanify', function(hooks) {
  let project;

  hooks.beforeEach(async function() {
    project = await createTempDir();
    process.chdir(project.path());
  });

  hooks.afterEach(async function() {
    process.chdir(ROOT);
    await project.dispose();
  });

  test('it works on a basic ember-cli@3.13 app structure', async function(assert) {
    project.write({
      '.ember-cli': `{
  /**
    Ember CLI sends analytics information by default. The data is completely
    anonymous, but there are times when you might want to disable this behavior.

    Setting \`disableAnalytics\` to true will prevent any data from being sent.
  */
  "disableAnalytics": false
}
`,
      config: {
        'optional-features.json': `{\n  "jquery-integration": false\n}`,
      },
      'package.json': JSON.stringify(
        {
          name: 'foo',
          devDependencies: {
            '@ember/optional-features': '^0.7.0',
            'ember-cli': '*',
          },
        },
        null,
        2
      ),
    });

    await execa(OCTANIFY_PATH);

    let expected = {
      '.ember-cli.js': `'use strict';
const { setEdition } = require('@ember/edition-utils');

setEdition('octane');

module.exports = {
  /**
    Ember CLI sends analytics information by default. The data is completely
    anonymous, but there are times when you might want to disable this behavior.

    Setting \`disableAnalytics\` to true will prevent any data from being sent.
  */
  "disableAnalytics": false
};
`,
      config: {
        'optional-features.json': JSON.stringify(
          {
            'application-template-wrapper': false,
            'default-async-observers': true,
            'jquery-integration': false,
            'template-only-glimmer-components': true,
          },
          null,
          2
        ),
      },
      'package.json': JSON.stringify(
        {
          name: 'foo',
          devDependencies: {
            '@ember/optional-features': '^1.0.0',
            'ember-cli': '*',
            '@ember/edition-utils': '^1.1.1',
          },
        },
        null,
        2
      ),
    };

    assert.deepEqual(project.read(), expected, 'running against standard 3.13 project works');

    await execa(OCTANIFY_PATH);

    assert.deepEqual(
      project.read(),
      expected,
      'running on already converted project has no effect'
    );
  });
});
