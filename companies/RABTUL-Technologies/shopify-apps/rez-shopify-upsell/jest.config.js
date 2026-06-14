{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/tests"],
  "testMatch": ["**/*.test.ts"],
  "moduleFileExtensions": ["ts", "tsx", "js", "jsx"],
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "verbose": true,
  "testTimeout": 30000,
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "transform": {
    "^.+\\.tsx?$": ["ts-jest", {
      "tsconfig": "tsconfig.json"
    }]
  },
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  }
}
