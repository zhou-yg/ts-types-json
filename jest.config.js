/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // globals: {
  //   'ts-jest': {
  //     useESM: true,
  //   }
  // },
  // extensionsToTreatAsEsm: ['.ts'],
  watch: !!process.env.W,
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: !!process.env.CI,
  collectCoverageFrom: ['./src/*.ts'],
  testMatch: ['**/test/*.test.ts'],
  modulePathIgnorePatterns: ['/node_modules/', '/dist/', '/mocks/'],
};
