const fs = require('fs-extra');
const path = require('path');
const { createTempDir } = require('broccoli-test-helper');
const execa = require('execa');

const { test } = QUnit;
const ROOT = process.cwd();
const OCTANIFY_PATH = require.resolve('./index');

async function octanify() {
  return execa(OCTANIFY_PATH, ['--run-codemod', '--skip-npm']);
}

QUnit.module('@ember/octanify', function(hooks) {
  let project;

  hooks.beforeEach(async function(assert) {
    project = await createTempDir();

    project.write({
      'package.json': JSON.stringify({
        name: 'dummy',
        description: '',
        version: '0.0.0',
        devDependencies: {
          '@ember/optional-features': '*',
          'ember-cli': '*',
          'ember-source': '*',
        },
      }),
    });

    process.chdir(project.path());

    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(project.path(), 'node_modules'));

    assert.compareProject = function(expected, message) {
      let actual = {
        'package.json': project.readText('package.json'),
        config: {
          'optional-features.json': project.readText('config/optional-features.json'),
        },
      };

      this.deepEqual(actual, expected, message);
    };
  });

  hooks.afterEach(async function() {
    process.chdir(ROOT);
    await project.dispose();
  });

  test('it works on a basic ember-cli@3.13 app structure', async function(assert) {
    project.write({
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

    await octanify();

    let expected = {
      config: {
        'optional-features.json':
          JSON.stringify(
            {
              'application-template-wrapper': false,
              'default-async-observers': true,
              'jquery-integration': false,
              'template-only-glimmer-components': true,
            },
            null,
            2
          ) + '\n',
      },
      'package.json': JSON.stringify(
        {
          name: 'foo',
          devDependencies: {
            '@ember/optional-features': '^1.3.0',
            '@glimmer/component': '^1.0.0',
            'ember-cli': '*',
          },
          ember: {
            edition: 'octane',
          },
        },
        null,
        2
      ),
    };

    assert.compareProject(expected, 'running against standard 3.13 project works');

    await octanify();

    assert.compareProject(expected, 'running on already converted project has no effect');
  });
});
