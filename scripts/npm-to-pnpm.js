#!/usr/bin/env node

/**
 * This script forwards pnpm commands to npm commands to maintain compatibility
 * with the pre-commit and pre-push hooks without modifying them.
 * 
 * Usage: node scripts/npm-to-pnpm.js <command> [args]
 */

const { spawn } = require('child_process');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('No command specified');
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

// Map pnpm exec to npm exec
if (command === 'exec') {
  runCommand('npx', commandArgs);
} else {
  // For all other commands, use npm run
  runCommand('npm', ['run', command, ...commandArgs]);
}

function runCommand(cmd, cmdArgs) {
  const child = spawn(cmd, cmdArgs, {
    stdio: 'inherit',
    env: { ...process.env }
  });

  child.on('close', (code) => {
    process.exit(code);
  });
}
