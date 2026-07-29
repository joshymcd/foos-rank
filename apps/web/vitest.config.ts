import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  server: {
      preset: "aws-lambda",
      awsLambda: { streaming: false }, 
    }
})
