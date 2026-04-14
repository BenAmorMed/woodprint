/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  coverageDirectory: 'coverage',
  verbose: true,
  roots: ['<rootDir>/src']
};
