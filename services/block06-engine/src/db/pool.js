import pg from 'pg'

const { Pool } = pg

let pool = null

export function getPool() {
  if (pool) return pool
  const url = process.env.DATABASE_URL
  if (!url) return null
  pool = new Pool({
    connectionString: url,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
    max: 5,
  })
  return pool
}

export async function query(text, params) {
  const p = getPool()
  if (!p) return null
  return p.query(text, params)
}
