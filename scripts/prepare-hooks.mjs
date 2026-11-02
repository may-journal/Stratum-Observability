#!/usr/bin/env node

// Usage: node scripts/prepare-hooks.mjs chooses the git hooks that `npm install` activates as its `prepare` script.
// It reads the HOME environment variable and the current checkout, sets core.hooksPath and always exits 0.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const installer = join(homedir(), '.local/share/may-journal/fitness/fitness-install');

// Windows ships npx as npx.cmd, which Node runs only through a shell.
const run = (command, args) => execFileSync(command, args, { stdio: 'ignore', shell: process.platform === 'win32' });

// Outside a git checkout, or without git, this script does nothing.
try {
  run('git', ['rev-parse', '--git-dir']);
} catch {
  process.exit(0);
}

// The org Fitness installer points git at .fitness-hooks, otherwise husky installs hooks that run the biome pre-commit lint.
try {
  if (existsSync(installer)) {
    run('git', ['config', '--local', 'core.hooksPath', '.fitness-hooks']);
  } else {
    run('npx', ['--no-install', 'husky']);
  }
} catch (error) {
  // When the hooks cannot be set up, this prints a one-line notice.
  console.log(`prepare-hooks: git hooks were not set up (${error.code ?? error.message}); commit hooks will not run.`);
}
