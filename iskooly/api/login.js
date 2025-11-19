// api/login.js
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';


// Create pool outside handler so Vercel reuses between invocations
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false },
max: 5,
idleTimeoutMillis: 30000,
connectionTimeoutMillis: 20000
});


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Only POST allowed' });


const { email, password } = req.body || {};
if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email and password required' });


try {
const client = await pool.connect();
try {
const q = 'SELECT id, name, email, password, role FROM users WHERE email = $1 LIMIT 1';
const r = await client.query(q, [email]);
if (r.rows.length === 0) return res.json({ status: 'error', message: 'Invalid email or password' });


const user = r.rows[0];
const ok = bcrypt.compareSync(password, user.password);
if (!ok) return res.json({ status: 'error', message: 'Invalid email or password' });


// remove sensitive fields before returning
return res.json({ status: 'success', message: 'Login successful', name: user.name, role: user.role });
} finally {
client.release();
}
} catch (err) {
console.error('Login error', err);
return res.status(500).json({ status: 'error', message: 'Server error' });
}
}
