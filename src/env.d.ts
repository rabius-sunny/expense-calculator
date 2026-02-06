/// <reference types="@cloudflare/workers-types" />

export type Env = {
  expense_db: D1Database
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
