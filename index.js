#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const execa = require('execa');
const chalk = require('chalk');
const sortPackageJson = require('sort-package-json');
const DETECT_TRAILING_WHITESPACE = /\s+$/;

function updatePackageJSON(root) {
  let packageJSONPath = path.join(root, 'package.json');

  let contents = fs.readFileSync(packageJSONPath, { encoding: 'utf8' });
  let trailingWhitespace = DETECT_TRAILING_WHITESPACE.exec(contents);
  let pkg = JSON.parse(contents);

  pkg.ember = pkg.ember || {};
  pkg.ember.edition = 'octane';
  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies['@ember/optional-features'] = '^1.3.0';
  pkg.devDependencies['@glimmer/component'] = '^1.0.0';

  let sortedPkg = sortPackageJson(pkg);
  let updatedContents = JSON.stringify(sortedPkg, null, 2);

  if (trailingWhitespace) {
    updatedContents += trailingWhitespace[0];
  }

  fs.writeFileSync(packageJSONPath, updatedContents, { encoding: 'utf-8' });
  console.log(chalk.green('Updated package.json\n'));
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
  const args = [`feature:${enableString}`, feature];

  if (process.argv.includes('--run-codemod')) {
    args.push('--run-codemod');
  }

  return execa('ember', args, { stdio: 'inherit' });
}

async function main() {
  let root = process.cwd();

  try {
    console.log(chalk.bold('Octanifying your project\n'));
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
