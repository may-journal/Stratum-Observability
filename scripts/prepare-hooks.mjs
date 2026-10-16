#!/usr/bin/env node

// Purpose: choose the git hooks that `npm install` activates (the `prepare` script).
// Usage: node scripts/prepare-hooks.mjs
// Inputs: the HOME environment variable and the current git checkout.
// Output: sets core.hooksPath and always exits 0.
//   - outside a git checkout, or without git: does nothing
//   - org Fitness installer present: points git at .fitness-hooks
//   - otherwise: installs husky's hooks, which run the biome pre-commit lint
//   - when the hooks cannot be set up: prints a one-line notice

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const installer = join(homedir(), '.local/share/may-journal/fitness/fitness-install');

// Windows ships npx as npx.cmd, which Node runs only through a shell.
const run = (command, args) => execFileSync(command, args, { stdio: 'ignore', shell: process.platform === 'win32' });

try {
  run('git', ['rev-parse', '--git-dir']);
} catch {
  process.exit(0);
}

try {
  if (existsSync(installer)) {
    run('git', ['config', '--local', 'core.hooksPath', '.fitness-hooks']);
  } else {
    run('npx', ['--no-install', 'husky']);
  }
} catch (error) {
  console.log(`prepare-hooks: git hooks were not set up (${error.code ?? error.message}); commit hooks will not run.`);
}
