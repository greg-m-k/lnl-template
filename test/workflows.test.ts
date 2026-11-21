// The Node version has one source, package.json, and every GitHub workflow takes it from there.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import pkg from '../package.json';

test('package.json declares one Node version, and every workflow takes it from package.json', () => {
  // engines.node (">=X") and devEngines.runtime ("^X") name the same version.
  const minimum = pkg.engines.node.replace(/^>=/, '');
  assert.equal(pkg.devEngines.runtime.name, 'node');
  assert.equal(pkg.devEngines.runtime.version, `^${minimum}`);

  const dir = new URL('../.github/workflows/', import.meta.url);
  const workflows = readdirSync(dir).filter((f) => f.endsWith('.yml'));
  assert.notEqual(workflows.length, 0);
  for (const file of workflows) {
    const yml = readFileSync(new URL(file, dir), 'utf8');
    // pnpm/setup installs Node from devEngines.runtime when no version is named.
    assert.match(yml, /uses: pnpm\/setup@/, `${file}: sets up Node through pnpm/setup`);
    assert.doesNotMatch(yml, /actions\/setup-node@/, `${file}: no separate Node setup`);
    assert.doesNotMatch(
      yml,
      /^\s*(node-version|node-version-file|runtime|version):/m,
      `${file} names a version itself`,
    );
  }
});
