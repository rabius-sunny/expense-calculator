import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema.ts'

export const createDb = (db: D1Database) => drizzle(db, { schema })
