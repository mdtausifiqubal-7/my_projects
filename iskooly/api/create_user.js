// api/create_user.js
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ status:'error', message:'Only POST' });

  const { name = 'Admin', email, password = 'Admin@123', role = 'Admin' } = req.body || {};
  if (!email || !password) return res.status(400).json({ status:'error', message:'Email & password required' });

  try {
    const hash = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hash, role }]);

    if (error) throw error;
    return res.json({ status: 'success', message: 'User created', data });
  } catch (err) {
    console.error('Create user error', err);
    return res.status(500).json({ status:'error', message: err.message || 'Server error' });
  }
}
