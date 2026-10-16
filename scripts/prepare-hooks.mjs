#!/usr/bin/env node

// Purpose: choose the git hooks that `npm install` activates (the `prepare` script).
// Usage: node scripts/prepare-hooks.mjs
// Inputs: the HOME environment variable and the current git checkout.
// Output: sets core.hooksPath. It prints nothing and always exits 0.
//   - outside a git checkout, or without git: does nothing
//   - org Fitness installer present: points git at .fitness-hooks
//   - otherwise: installs husky's hooks, which run the biome pre-commit lint

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const installer = join(homedir(), '.local/share/may-journal/fitness/fitness-install');

const run = (command, args) => execFileSync(command, args, { stdio: 'ignore' });

try {
  run('git', ['rev-parse', '--git-dir']);
} catch {
  process.exit(0);
}

if (existsSync(installer)) {
  run('git', ['config', '--local', 'core.hooksPath', '.fitness-hooks']);
} else {
  run('npx', ['--no-install', 'husky']);
}
