# Migration from npm to pnpm

This document provides information about the migration from npm to pnpm in the Clifford-deJong monorepo.

## Why pnpm?

We migrated from npm to pnpm for the following reasons:

1. **Disk space efficiency**: pnpm uses a content-addressable store to avoid duplicate packages, saving disk space.
2. **Strict dependency management**: pnpm creates a more accurate dependency tree, ensuring that packages can only access dependencies they have explicitly declared.
3. **Performance**: pnpm is faster than npm for installations in monorepos due to its optimized caching and linking strategy.
4. **Better monorepo support**: pnpm has built-in features for handling workspace packages, making it ideal for monorepo setups.

## Changes Made

The following changes were made to migrate from npm to pnpm:

1. **Root package.json**:
   - Updated `packageManager` field to use pnpm: `"packageManager": "pnpm@8.10.0"`
   - Updated scripts to use `pnpm` instead of `npm` for commands

2. **Workspace Configuration**:
   - Created `pnpm-workspace.yaml` to define workspace packages
   - Added `.npmrc` with settings for handling dependency hoisting and peer dependencies

3. **Dependencies**:
   - Updated workspace package references to use `workspace:*` protocol for local dependencies

4. **Mobile Setup**:
   - Updated `setup.sh` to handle React Native dependencies with pnpm's unique node_modules structure
   - Improved symlink creation for React Native modules in pnpm's virtual store

5. **CI/CD**:
   - Updated GitHub Actions workflows to install and use pnpm

## Important pnpm Commands

```bash
# Install all dependencies
pnpm install

# Run a script in a specific workspace
pnpm --filter <workspace> <script>

# Add a dependency to a specific workspace
pnpm --filter <workspace> add <package>

# Add a dev dependency to a specific workspace
pnpm --filter <workspace> add -D <package>

# Run a command in all workspaces
pnpm -r <command>

# Link a local package to another workspace
pnpm --filter <target> add <source> --workspace
```

## Troubleshooting

### React Native Issues

If you encounter issues with React Native in the mobile app, run the setup script:

```bash
cd apps/mobile && ./setup.sh
```

The setup script has been updated to create proper symlinks for React Native dependencies when using pnpm.

### Peer Dependency Warnings

pnpm is stricter about peer dependencies. If you see warnings, use the `--shamefully-hoist` flag or update the dependencies to compatible versions.
