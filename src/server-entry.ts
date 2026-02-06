import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'

import type { Env } from './env'

const handler = createStartHandler(defaultStreamHandler)

const serverEntry = {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler(request, { context: { env, ctx } })
  },
}

export default serverEntry
