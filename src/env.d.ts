/// <reference types="@cloudflare/workers-types" />

export type Env = {
  expense_db: D1Database
  AUTH_EMAIL: string
  AUTH_PASSWORD: string
}

declare module '@tanstack/react-start' {
  interface Register {
    server: {
      requestContext: {
        env: Env
        ctx: ExecutionContext
      }
    }
  }
}
