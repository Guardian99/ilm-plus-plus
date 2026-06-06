import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Points next/jest at the Next.js app root to load next.config.ts and .env files
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // next/jest reads tsconfig paths automatically, but we pin it explicitly
  // because our tsconfig maps @/* → src/* and we need jest to match.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/', '<rootDir>/tests/e2e/'],
}

// createJestConfig wraps the config so next/jest can load the async Next.js config
export default createJestConfig(config)
