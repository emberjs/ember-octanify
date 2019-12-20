#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const chalk = require('chalk');

function updatePackageJSON(root) {
  let packageJSONPath = path.join(root, 'package.json');
  let pkg = JSON.parse(fs.readFileSync(packageJSONPath, { encoding: 'utf-8' }));

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['@ember/edition-utils'] = '^1.2.0';
  pkg.devDependencies['@ember/optional-features'] = '^1.3.0';
  pkg.devDependencies['@glimmer/component'] = '^1.0.0';

  fs.writeFileSync(packageJSONPath, JSON.stringify(pkg, null, 2), { encoding: 'utf-8' });
  console.log(chalk.green('Updated package.json\n'));
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

  console.log(
    chalk.green(
      `Migrated ${chalk.underline('.ember-cli')} to ${chalk.underline('.ember-cli.js')}\n`
    )
  );
}

async function updateOptionalFeatures() {
  console.log(
    `About to update ${chalk.underline(
      'config/optional-features.json'
    )} you may be prompted for codemods`
  );
  const features = [
    ['default-async-observers', true],
    ['jquery-integration', false],
    ['template-only-glimmer-components', true],
    ['application-template-wrapper', false],
  ];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    await emberFeature(...feature);
  }
  console.log();
}

async function emberFeature(feature, enable) {
  const enableString = enable ? 'enable' : 'disable';
  return execa('ember', [`feature:${enableString}`, feature], { stdio: 'inherit' });
}

async function main() {
  let root = process.cwd();

  try {
    console.log(chalk.bold('Octanifying your project\n'));
    await migrateEmberCLIFile(root);
    await updateOptionalFeatures();
    await updatePackageJSON(root);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

if (require.main === module) {
  main();
}
