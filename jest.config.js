const path = require('path')

/**
 * @file Jest Configuration
 * @see https://jestjs.io/docs/en/configuration
 */

module.exports = {
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json'
    }
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^fixtures/(.*)$': '<rootDir>/__tests__/fixtures/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1'
  },
  prettierPath: path.join(__dirname, 'node_modules', 'prettier'),
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['fixtures/', 'node_modules/', '(.*).d.ts'],
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  verbose: true
}
