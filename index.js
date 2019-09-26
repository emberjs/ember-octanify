#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');

function updatePackageJSON(root) {
  let packageJSONPath = path.join(root, 'package.json');
  let pkg = JSON.parse(fs.readFileSync(packageJSONPath, { encoding: 'utf-8' }));

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['@ember/edition-utils'] = '^1.1.1';
  pkg.devDependencies['@ember/optional-features'] = '^1.0.0';
  pkg.devDependencies['@glimmer/component'] = '^0.14.0-alpha.13';

  fs.writeFileSync(packageJSONPath, JSON.stringify(pkg, null, 2), { encoding: 'utf-8' });
}

function migrateEmberCLIFile(root) {
  let newConfigPath = path.join(root, '.ember-cli.js');
  let oldConfigPath = path.join(root, '.ember-cli');

  if (fs.existsSync(newConfigPath)) {
    return false;
  }

  if (!fs.existsSync(oldConfigPath)) {
    throw new Error(
      'Does not seem to be a valid ember-cli project, please run `npx @ember/octanify` from within your ember-cli application or addon directly'
    );
  }

  let existingContents = fs.readFileSync(oldConfigPath, { encoding: 'utf-8' });

  let updatedContents = `'use strict';
const { setEdition } = require('@ember/edition-utils');

setEdition('octane');

module.exports = ${existingContents.trimRight()};\n`;

  fs.writeFileSync(newConfigPath, updatedContents, { encoding: 'utf-8' });

  fs.unlinkSync(oldConfigPath);
}

async function updateOptionalFeatures(root) {
  let packageJSONPath = path.join(root, 'package.json');
  let pkg = JSON.parse(fs.readFileSync(packageJSONPath, { encoding: 'utf-8' }));

  let configPath = 'config/optional-features.json';
  if (pkg['ember-addon'] && pkg['ember-addon'].configPath) {
    configPath = pkg['ember-addon'].configPath;
  }

  let config = {};
  if (fs.existsSync(configPath)) {
    let configContents = fs.readFileSync(configPath, { encoding: 'utf-8' });
    config = JSON.parse(configContents);
  }

  config['application-template-wrapper'] = false;
  config['default-async-observers'] = true;
  config['jquery-integration'] = false;
  config['template-only-glimmer-components'] = true;

  let keys = Object.keys(config);
  let newConfig = {};
  keys.sort().forEach(key => (newConfig[key] = config[key]));

  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), { encoding: 'utf-8' });
}

async function main() {
  let root = process.cwd();

  try {
    await migrateEmberCLIFile(root);
    await updatePackageJSON(root);
    await updateOptionalFeatures(root);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

if (require.main === module) {
  main();
}
