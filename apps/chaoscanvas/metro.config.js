const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Find the workspace root
const workspaceRoot = path.resolve(__dirname, '../..');
const projectRoot = __dirname;
const srcDir = path.resolve(projectRoot, 'src');
const coreDir = path.resolve(projectRoot, '../../packages/core');
const stateDir = path.resolve(projectRoot, '../../packages/state');

const config = {
  projectRoot: projectRoot,

  // 1. Watch all files within the monorepo
  watchFolders: [
    srcDir,
    coreDir,
    stateDir,
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ],
  // 2. Let Metro know where to resolve packages, and in what order
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    // 3. Force Metro to resolve (sub)dependencies only from the `nodeModulesPaths`
    disableHierarchicalLookup: true,
  },
};

const mergedConfig = mergeConfig(getDefaultConfig(__dirname), config);

module.exports = mergedConfig;
