module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@specs': './specs',
          '@repo': '../../packages',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};
