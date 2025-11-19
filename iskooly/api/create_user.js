// api/create_user.js
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';


const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: { rejectUnauthorized: false }
});


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Only POST allowed' });


const { name = 'Admin', email, password = 'Admin@123', role = 'Admin' } = req.body || {};
if (!email || !password) return res.status(400).json({ status: 'error', message: 'Email & password required' });


try {
const hashed = bcrypt.hashSync(password, 10);
const client = await pool.connect();
try {
const q = 'INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id';
const r = await client.query(q, [name, email, hashed, role]);
return res.json({ status: 'success', message: 'User created', id: r.rows[0].id });
} finally {
client.release();
}
} catch (err) {
console.error('Create user error', err);
return res.status(500).json({ status: 'error', message: err.message || 'Server error' });
}
}
