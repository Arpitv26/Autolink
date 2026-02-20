const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [
  {
    ignores: [
      'node_modules',
      'dist',
      'web-build',
      '.expo',
    ],
  },
  ...compat.extends('expo'),
];
