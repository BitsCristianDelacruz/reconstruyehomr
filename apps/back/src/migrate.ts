import { connectDatabase, migrate } from './database.js';
const pool = await connectDatabase();
try { await migrate(pool); } finally { await pool.close(); }
