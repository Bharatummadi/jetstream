const nxPreset = require('@nrwl/jest/preset').default;

/** @type {import('jest').Config} */
const config = {
  ...nxPreset,
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  modulePathIgnorePatterns: ['apps/jetstream-e2e/'],
  transform: {
    '^.+\\.(ts|js|html)$': 'ts-jest',
  },
  resolver: '@nrwl/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageReporters: ['html'],
};

module.exports = config;