import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '../db/seed.sql')

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('Set DATABASE_URL in services/block06-engine/.env')
    process.exit(1)
  }
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    await client.query(sql)
    console.log('Seed OK: BLOCK-06A template')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
